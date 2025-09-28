// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Alarm app smart contract that allows users to set alarms with deposits and charity donations
module alarm::alarm {
    // --- Imports Sui (0x2) ---
    use sui::object::{UID, ID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::coin::Coin;
    use sui::balance::Balance;
    use sui::sui::SUI;
    use sui::clock::Clock;
    use sui::event;
    use std::string::String;
    use std::option::Option;
    use std::option;

    // --- Imports système (0x3) pour le staking natif ---
    use 0x3::sui_system::SuiSystemState;
    use 0x3::staking_pool::StakedSui;

    /// Constantes
    const GRACE_MS: u64 = 10 * 60 * 1000;       // 10 minutes après l'heure de réveil
    const CANCEL_REFUND_BPS: u64 = 9000;        // 90% de refund sur cancel (basis points)

    /// Objet partagé principal
    struct Alarm has key {
        id: UID,
        owner: address,
        habit_type: String,               // ex. "write 3 affirmations"
        wake_up_time: u64,                // ms
        deposit_amount: u64,              // snapshot du principal à la création
        charity_address: address,
        validator: address,               // adresse du validateur choisi
        stake: Option<StakedSui>,         // SUI staké (dans un Option pour pouvoir l'extraire)
        is_active: bool,
        is_completed: bool,
    }

    /// Events
    struct AlarmCreated has copy, drop {
        alarm_id: ID,
        owner: address,
        wake_up_time: u64,
        deposit_amount: u64,
        charity_address: address,
    }

    struct AlarmCompleted has copy, drop {
        alarm_id: ID,
        owner: address,
    }

    struct AlarmFailed has copy, drop {
        alarm_id: ID,
        owner: address,
        charity_address: address,
        amount: u64,
    }

    /// Codes d'erreur
    const EAlarmNotActive: u64 = 1;
    const ENotOwner: u64 = 2;
    const EAlarmNotReady: u64 = 3;
    const EAlarmAlreadyCompleted: u64 = 4;

    /// Création + staking automatique
    public entry fun create_alarm(
        habit_type: String,
        wake_up_time: u64,
        charity_address: address,
        validator: address,
        deposit: Coin<SUI>,
        system: &mut SuiSystemState,
        ctx: &mut TxContext
    ) {
        let deposit_amount = sui::coin::value<SUI>(&deposit);
        let alarm_id = sui::object::new(ctx);
        let owner = sui::tx_context::sender(ctx);

        // Stake: transfère le Coin<SUI> au pool du validateur -> renvoie StakedSui
        let staked: StakedSui = 0x3::sui_system::request_add_stake_non_entry(
            system,
            deposit,
            validator,
            ctx
        );

        // Event de création
        event::emit(AlarmCreated {
            alarm_id: sui::object::uid_to_inner(&alarm_id),
            owner,
            wake_up_time,
            deposit_amount,
            charity_address,
        });

        let alarm = Alarm {
            id: alarm_id,
            owner,
            habit_type,
            wake_up_time,
            deposit_amount,
            charity_address,
            validator,
            stake: option::some<StakedSui>(staked),
            is_active: true,
            is_completed: false,
        };

        transfer::share_object(alarm);
    }

    /// Succès : l'owner récupère principal + rewards (withdraw + transfert)
    public entry fun complete_alarm(
        alarm: &mut Alarm,
        system: &mut SuiSystemState,
        clock_obj: &Clock,
        ctx: &mut TxContext
    ) {
        // Accès + état
        assert!(alarm.owner == sui::tx_context::sender(ctx), ENotOwner);
        assert!(alarm.is_active, EAlarmNotActive);
        assert!(!alarm.is_completed, EAlarmAlreadyCompleted);

        // Pas avant l'heure
        let now = sui::clock::timestamp_ms(clock_obj);
        assert!(now >= alarm.wake_up_time, EAlarmNotReady);

        // Verrouille l'état d'abord (évite double exécution)
        alarm.is_completed = true;
        alarm.is_active = false;

        // Extraire le StakedSui (pas de copy) puis withdraw -> Balance<SUI>
        let staked: StakedSui = option::extract<StakedSui>(&mut alarm.stake);
        let bal: Balance<SUI> =
            0x3::sui_system::request_withdraw_stake_non_entry(system, staked, ctx);

        // Convertit en Coin<SUI> puis transfert à l'owner
        let coin_out: Coin<SUI> = sui::coin::from_balance<SUI>(bal, ctx);
        transfer::public_transfer(coin_out, alarm.owner);

        // Event
        event::emit(AlarmCompleted {
            alarm_id: sui::object::uid_to_inner(&alarm.id),
            owner: alarm.owner,
        });
    }

    /// Échec (permissionless après GRACE_MS) : tout va à la charity
    public entry fun fail_alarm(
        alarm: &mut Alarm,
        system: &mut SuiSystemState,
        clock_obj: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(alarm.is_active, EAlarmNotActive);
        assert!(!alarm.is_completed, EAlarmAlreadyCompleted);

        let now = sui::clock::timestamp_ms(clock_obj);
        assert!(now >= alarm.wake_up_time + GRACE_MS, EAlarmNotReady);

        // Verrouille l'état
        alarm.is_completed = true;
        alarm.is_active = false;

        // Extraire stake puis withdraw -> Balance<SUI> -> Coin<SUI>
        let staked: StakedSui = option::extract<StakedSui>(&mut alarm.stake);
        let bal: Balance<SUI> =
            0x3::sui_system::request_withdraw_stake_non_entry(system, staked, ctx);
        let coin_out: Coin<SUI> = sui::coin::from_balance<SUI>(bal, ctx);
        let amount: u64 = sui::coin::value<SUI>(&coin_out);

        // Envoi à l'ONG
        transfer::public_transfer(coin_out, alarm.charity_address);

        // Event
        event::emit(AlarmFailed {
            alarm_id: sui::object::uid_to_inner(&alarm.id),
            owner: alarm.owner,
            charity_address: alarm.charity_address,
            amount,
        });
    }

    /// Annulation par l'owner : 90% remboursé, 10% vers la charity
    public entry fun cancel_alarm(
        alarm: &mut Alarm,
        system: &mut SuiSystemState,
        ctx: &mut TxContext
    ) {
        assert!(alarm.owner == sui::tx_context::sender(ctx), ENotOwner);
        assert!(alarm.is_active, EAlarmNotActive);
        assert!(!alarm.is_completed, EAlarmAlreadyCompleted);

        // Verrouille l'état
        alarm.is_completed = true;
        alarm.is_active = false;

        // Withdraw -> Balance<SUI> -> Coin<SUI>
        let staked: StakedSui = option::extract<StakedSui>(&mut alarm.stake);
        let bal: Balance<SUI> =
            0x3::sui_system::request_withdraw_stake_non_entry(system, staked, ctx);
        let mut coin_out: Coin<SUI> = sui::coin::from_balance<SUI>(bal, ctx);

        let total: u64 = sui::coin::value<SUI>(&coin_out);
        let refund_amt: u64 = (total * CANCEL_REFUND_BPS) / 10_000;

        let refund: Coin<SUI> = sui::coin::split<SUI>(&mut coin_out, refund_amt, ctx);
        transfer::public_transfer(refund, alarm.owner);

        // Le reste (~10%) à la charity
        transfer::public_transfer(coin_out, alarm.charity_address);
    }

    // --- Getters ---
    public fun get_wake_up_time(alarm: &Alarm): u64 { alarm.wake_up_time }
    public fun get_deposit_amount(alarm: &Alarm): u64 { alarm.deposit_amount }
    public fun get_charity_address(alarm: &Alarm): address { alarm.charity_address }
    public fun is_active(alarm: &Alarm): bool { alarm.is_active }
    public fun is_completed(alarm: &Alarm): bool { alarm.is_completed }
    public fun get_owner(alarm: &Alarm): address { alarm.owner }
}
