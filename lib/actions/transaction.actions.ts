"use server";
import { getDatabase } from "../mongodb";
import { parseStringify } from "../utils";

export const createTransaction = async (
  transaction: CreateTransactionProps,
) => {
  try {
    const db = await getDatabase();
    const transactionCollection = db.collection("transactions");

    const transactionData = {
      name: transaction.name,
      amount: transaction.amount,
      channel: "Online",
      category: "Transfer",
      senderId: transaction.senderId,
      senderBankId: transaction.senderBankId,
      receiverId: transaction.receiverId,
      receiverBankId: transaction.receiverBankId,
      email: transaction.email,
      createdAt: new Date(),
    };

    const newTransaction = await transactionCollection.insertOne(transactionData);

    return parseStringify(newTransaction);
  } catch (error) {
    console.log(error);
  }
};

export const getTransactionsByBankId = async (
  { bankId }: getTransactionsByBankIdProps,
) => {
  try {
    const db = await getDatabase();
    const transactionCollection = db.collection("transactions");

    const senderTransactions = await transactionCollection.find({ senderBankId: bankId }).toArray();
    const receiverTransactions = await transactionCollection.find({ receiverBankId: bankId }).toArray();

    const transactions = [...senderTransactions, ...receiverTransactions];

    return parseStringify(transactions);
  } catch (error) {
    console.log(error);
  }
};