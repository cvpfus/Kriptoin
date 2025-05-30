"use client";

import { UniversalKriptoinAbi } from "@/abi/UniversalKriptoinAbi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Loading from "@/components/ui/loading";
import { UniversalKriptoinAddress } from "@/constants";
import { useIsRegisteredByAddress } from "@/hooks/use-is-registered-by-address";
import { config } from "@/lib/wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { waitForTransactionReceipt } from "@wagmi/core";
import { Loader2, NotebookPen } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { BaseError, useAccount, useWriteContract } from "wagmi";

export default function Register() {
  const account = useAccount();
  const isRegistered = useIsRegisteredByAddress(account.address);

  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract } = useWriteContract();

  const queryClient = useQueryClient();

  if (isRegistered.status === "success" && isRegistered.data) {
    return null;
  }

  if (isRegistered.status === "pending") return <Loading />;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    writeContract(
      {
        abi: UniversalKriptoinAbi,
        address: UniversalKriptoinAddress,
        functionName: "deployContract",
        args: [username],
      },
      {
        onSuccess: async (data) => {
          await waitForTransactionReceipt(config, {
            hash: data,
          });

          setTimeout(async () => {
            await queryClient.invalidateQueries();
          }, 1000);

          toast.success("Registration successful");
          setIsLoading(false);
        },
        onError: (error) => {
          toast.error(
            (error as BaseError).details ||
              "Failed to register. See console for detailed error."
          );

          console.error(error.message);
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>
          <div>
            Register a username to make your URLs shorter and unlock additional
            features.
          </div>
          <div>
            Username must be between 2 and 15 characters long. Username can only
            contain letters and numbers.
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          <Input
            placeholder="Username"
            required
            minLength={2}
            maxLength={15}
            pattern="^[a-zA-Z0-9]+$"
            autoComplete="off"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
          />
          <Button
            type="submit"
            className="self-start flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <NotebookPen />}
            <span>Register</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
