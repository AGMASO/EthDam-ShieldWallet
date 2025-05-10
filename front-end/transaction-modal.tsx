"use client"

import { useState } from "react"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TransactionButtons() {
  const [open, setOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<"send" | "receive" | null>(null)

  const handleOpenModal = (type: "send" | "receive") => {
    setTransactionType(type)
    setOpen(true)
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2" onClick={() => handleOpenModal("send")}>
          <ArrowUpRight className="h-4 w-4" />
          Send
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => handleOpenModal("receive")}>
          <ArrowDownLeft className="h-4 w-4" />
          Receive
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{transactionType === "send" ? "Send Transaction" : "Receive Transaction"}</DialogTitle>
            <DialogDescription>
              {transactionType === "send" ? "Create a new outgoing transaction" : "Create a new incoming transaction"}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" placeholder="0.00" className="col-span-3" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                  <SelectItem value="btc">BTC</SelectItem>
                  <SelectItem value="eth">ETH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recipient">{transactionType === "send" ? "Recipient" : "Sender"}</Label>
              <Input
                id="recipient"
                placeholder={transactionType === "send" ? "Recipient address" : "Sender address"}
                className="col-span-3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input id="notes" placeholder="Add transaction notes" className="col-span-3" />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{transactionType === "send" ? "Send Transaction" : "Receive Transaction"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
