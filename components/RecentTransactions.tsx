'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankTabItem } from './BankTabItem'
import BankInfo from './BankInfo'
import TransactionsTable from './TransactionsTable'
import { Pagination } from './Pagination'

const RecentTransactions = ({ accounts, transactions = [], appwriteItemId, page = 1 }: RecentTransactionsProps) => {
    const [selectedAccountId, setSelectedAccountId] = useState(appwriteItemId);

    const getTransactionsByAccount = (accountId: string) => {
        return transactions.filter((transaction: Transaction) => transaction.accountId === accountId);
    };

    const rowsPerPage = 10;
    const accountTransactionsMap: { [key: string]: Transaction[] } = {};

    accounts.forEach((account: Account) => {
        const accountTxns = getTransactionsByAccount(account.id);
        accountTransactionsMap[account.id] = accountTxns;
    });

    const selectedTransactions = accountTransactionsMap[selectedAccountId] || [];
    const totalPages = Math.ceil(selectedTransactions.length / rowsPerPage);

    const indexOfLastTransaction = page * rowsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;
    const currentTransactions = selectedTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

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
                            <BankTabItem account={account} selectedAccountId={selectedAccountId} />
                        </TabsTrigger>
                    ))}
                </TabsList>
                {accounts.map((account: Account) => {
                    return (
                        <TabsContent value={account.id} key={account.id} className="space-y-4">
                            <BankInfo account={account} appwriteItemId={account.id} type="full" />
                            {selectedAccountId === account.id && (
                                <>
                                    <TransactionsTable transactions={currentTransactions} />
                                    {totalPages > 1 && (
                                        <div className="my-4 w-full">
                                            <Pagination
                                                totalPages={totalPages}
                                                page={page}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>
                    );
                })}
            </Tabs>
        </section>
    )
}

export default RecentTransactions