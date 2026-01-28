import React from 'react';
import HeaderBox from '@/components/HeaderBox';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import RightSidebar from '@/components/RightSidebar';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import RecentTransactions from '@/components/RecentTransactions';

const Home = async ({ searchParams }: SearchParamProps) => {
  const { id, page } = await searchParams;
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts({ userId: loggedIn.$id });

  if (!accounts) return;

  const accountsData = accounts.data;
  const accountId = (id as string) || accountsData[0].id; 

  // Fetch transactions for all accounts
  const allAccountsWithTransactions = await Promise.all(
    accountsData.map(async (acc: Account) => {
      const accountData = await getAccount({ appwriteItemId: acc.id });
      return {
        ...acc,
        transactions: accountData?.transactions
      };
    })
  );

  // Flatten all transactions from all accounts
  const allTransactions = allAccountsWithTransactions.flatMap(acc => 
    (acc.transactions).map((transaction: Transaction) => ({
      ...transaction,
      accountId: acc.id // Ensure each transaction has the account id
    }))
  );

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn?.firstName || "Guest"}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox 
            accounts={accountsData}
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance} />
        </header>

        <RecentTransactions 
          accounts={accountsData} 
          transactions={allTransactions} 
          appwriteItemId={accountId} 
          page={currentPage} />
      </div>
      <RightSidebar 
        user={loggedIn}
        transactions={allTransactions}
        banks={accountsData?.slice(0, 2)}
      />
    </section>
  )
}

export default Home