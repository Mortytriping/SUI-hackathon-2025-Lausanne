import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";

export function CreateCounter({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const counterPackageId = useNetworkVariable("counterPackageId");
  const suiClient = useSuiClient();
  const {
    mutate: signAndExecute,
    isSuccess,
    isPending,
  } = useSignAndExecuteTransaction();


  function create() {
    console.log('creating tx')
    const tx = new Transaction();

    tx.moveCall({
      arguments: [],
      target: `${counterPackageId}::counter::create`,
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async ({ digest }) => {
          const { effects } = await suiClient.waitForTransaction({
            digest: digest,
            options: {
              showEffects: true,
            },
          });

          onCreated(effects?.created?.[0]?.reference?.objectId!);
        },
      },
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-gray-900">Create New Counter</CardTitle>
        <CardDescription className="text-gray-600">
          Create a new counter that you can increment and reset. You'll be the owner of this counter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          size="lg"
          onClick={() => {
            create();
          }}
          disabled={isSuccess || isPending}
          className="w-full text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
        >
          {isSuccess || isPending ? <ClipLoader size={20} color="white" /> : "Create Counter"}
        </Button>
      </CardContent>
    </Card>
  );
}
