// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Alarm app smart contract that allows users to set alarms with deposits and charity donations
module alarm::alarm {
  use sui::coin::{Self, Coin};
  use sui::sui::SUI;
  use sui::clock::{Self, Clock};
  use sui::event;
  use std::string::String;
  
  /// Shared alarm object
  public struct Alarm has key {
    id: UID,
    owner: address,
    habit_type: String,  // type of habit being tracked
    wake_up_time: u64,  // timestamp in milliseconds
    deposit_amount: u64,
    charity_address: address,
    deposit: Coin<SUI>,
    is_active: bool,
    is_completed: bool,
  }

  /// Event emitted when an alarm is created
  public struct AlarmCreated has copy, drop {
    alarm_id: ID,
    owner: address,
    habit_type: String,
    wake_up_time: u64,
    deposit_amount: u64,
    charity_address: address,
  }

  /// Event emitted when an alarm is completed successfully
  public struct AlarmCompleted has copy, drop {
    alarm_id: ID,
    owner: address,
  }

  /// Event emitted when an alarm fails and deposit goes to charity
  public struct AlarmFailed has copy, drop {
    alarm_id: ID,
    owner: address,
    charity_address: address,
    amount: u64,
  }

  /// Error codes
  const EAlarmNotActive: u64 = 1;
  const ENotOwner: u64 = 2;
  const EAlarmNotReady: u64 = 3;
  const EAlarmAlreadyCompleted: u64 = 4;

  /// Create and share an Alarm object
  public fun create_alarm(
    habit_type: String,
    wake_up_time: u64,
    charity_address: address,
    deposit: Coin<SUI>,
    ctx: &mut TxContext
  ) {
    let deposit_amount = coin::value(&deposit);
    let alarm_id = object::new(ctx);
    let owner = tx_context::sender(ctx);
    
    // Emit event
    event::emit(AlarmCreated {
      alarm_id: object::uid_to_inner(&alarm_id),
      owner,
      habit_type,
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
      deposit,
      is_active: true,
      is_completed: false,
    };

    transfer::share_object(alarm);
  }

  /// Complete alarm successfully - user gets their deposit back
  public fun complete_alarm(alarm: &mut Alarm, clock: &Clock, ctx: &mut TxContext) {
    assert!(alarm.owner == tx_context::sender(ctx), ENotOwner);
    assert!(alarm.is_active, EAlarmNotActive);
    assert!(!alarm.is_completed, EAlarmAlreadyCompleted);
    
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time >= alarm.wake_up_time, EAlarmNotReady);

    // Mark as completed
    alarm.is_completed = true;
    alarm.is_active = false;

    // Return deposit to owner
    let deposit = coin::split(&mut alarm.deposit, alarm.deposit_amount, ctx);
    transfer::public_transfer(deposit, alarm.owner);

    // Emit event
    event::emit(AlarmCompleted {
      alarm_id: object::uid_to_inner(&alarm.id),
      owner: alarm.owner,
    });
  }

  /// Fail alarm - deposit goes to charity (can be called by anyone after the wake up time has passed)
  public fun fail_alarm(alarm: &mut Alarm, clock: &Clock, ctx: &mut TxContext) {
    assert!(alarm.is_active, EAlarmNotActive);
    assert!(!alarm.is_completed, EAlarmAlreadyCompleted);
    
    let current_time = clock::timestamp_ms(clock);
    // Allow failure only after some grace period (e.g., 1 hour = 3600000 ms)
    let grace_period = 3600000; // 1 hour
    assert!(current_time >= alarm.wake_up_time + grace_period, EAlarmNotReady);

    // Mark as completed (failed)
    alarm.is_completed = true;
    alarm.is_active = false;

    // Send deposit to charity
    let deposit = coin::split(&mut alarm.deposit, alarm.deposit_amount, ctx);
    transfer::public_transfer(deposit, alarm.charity_address);

    // Emit event
    event::emit(AlarmFailed {
      alarm_id: object::uid_to_inner(&alarm.id),
      owner: alarm.owner,
      charity_address: alarm.charity_address,
      amount: alarm.deposit_amount,
    });
  }

  /// Cancel alarm (only by owner, returns deposit minus a small fee)
  public fun cancel_alarm(alarm: &mut Alarm, ctx: &mut TxContext) {
    assert!(alarm.owner == tx_context::sender(ctx), ENotOwner);
    assert!(alarm.is_active, EAlarmNotActive);
    assert!(!alarm.is_completed, EAlarmAlreadyCompleted);

    // Mark as completed (cancelled)
    alarm.is_completed = true;
    alarm.is_active = false;

    // Return 90% of deposit to owner, 10% stays in contract as cancellation fee
    let refund_amount = (alarm.deposit_amount * 9) / 10;
    let deposit = coin::split(&mut alarm.deposit, refund_amount, ctx);
    transfer::public_transfer(deposit, alarm.owner);
  }

  // Getter functions
  public fun get_wake_up_time(alarm: &Alarm): u64 {
    alarm.wake_up_time
  }

  public fun get_deposit_amount(alarm: &Alarm): u64 {
    alarm.deposit_amount
  }

  public fun get_charity_address(alarm: &Alarm): address {
    alarm.charity_address
  }

  public fun is_active(alarm: &Alarm): bool {
    alarm.is_active
  }

  public fun is_completed(alarm: &Alarm): bool {
    alarm.is_completed
  }

  public fun get_owner(alarm: &Alarm): address {
    alarm.owner
  }
}
