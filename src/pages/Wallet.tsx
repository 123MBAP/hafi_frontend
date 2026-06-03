import React from 'react';
import walletIcon from '../pages/images/wallet.png'; // your icon path

const Wallet: React.FC = () => {
  const transactions = [
    { id: 1, type: 'Deposit', amount: 5000, date: '2025-06-10' },
    { id: 2, type: 'Withdrawal', amount: 2000, date: '2025-06-12' },
    { id: 3, type: 'Service Payment Received', amount: 15000, date: '2025-06-14' },
  ];

  const balance = 18000;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      {/* Icon at the top center */}
      <div className="flex justify-center mb-4">
        <img src={walletIcon} alt="Wallet Icon" className="w-30 h-40 rounded-lg" />
      </div>

      <h2 className="text-2xl font-semibold text-center text-purple-600 mb-6">My Wallet</h2>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600">Current Balance</p>
          <h3 className="text-3xl font-bold text-green-600">RWF {balance.toLocaleString()}</h3>
        </div>
        <div className="space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Funds</button>
          <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Withdraw</button>
        </div>
      </div>

      <h4 className="text-xl font-medium mb-4">Recent Transactions</h4>
      <ul className="space-y-3">
        {transactions.map(tx => (
          <li key={tx.id} className="flex justify-between items-center border-b pb-2">
            <span className="font-medium text-gray-700">{tx.type}</span>
            <span className={`font-semibold ${tx.type === 'Withdrawal' ? 'text-red-500' : 'text-green-500'}`}>
              RWF {tx.amount.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">{tx.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Wallet;
