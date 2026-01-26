'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankTabItem } from './BankTabItem'
import BankInfo from './BankInfo'
import TransactionsTable from './TransactionsTable'

const RecentTransactions = ({ accounts, transactions = [], appwriteItemId, page = 1 }: RecentTransactionsProps) => {
    const [selectedAccountId, setSelectedAccountId] = useState(appwriteItemId);

    const getTransactionsByAccount = (accountId: string) => {
        return transactions.filter((transaction: Transaction) => transaction.accountId === accountId);
    };

    return (
        <section className="recent-transactions">
            <header className="flex items-center justify-between">
                <h2 className="recent-transactions-label">
                    Recent transactions
                </h2>
                <Link href={`/transaction-history/?id=${selectedAccountId}`} className="view-all-btn">
                    View all
                </Link>
            </header>

            <Tabs value={selectedAccountId} onValueChange={setSelectedAccountId} className="w-full">
                <TabsList className="recent-transactions-tablist">
                    {accounts.map((account: Account) => (
                        <TabsTrigger key={account.id} value={account.id}>
                            <BankTabItem account={account} selectedAccountId={selectedAccountId}/>
                        </TabsTrigger>
                    ))}
                </TabsList>
                {accounts.map((account: Account) => {
                    const accountTransactions = getTransactionsByAccount(account.id);
                    return (
                        <TabsContent value={account.id} key={account.id} className="space-y-4">
                            <BankInfo account={account} appwriteItemId={account.id} type="full"/>
                            <TransactionsTable transactions={accountTransactions}/>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </section>
    )
}

export default RecentTransactions