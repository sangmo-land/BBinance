import { useForm, usePage } from '@inertiajs/react'
import { useMemo } from 'react'

export default function DemoDashboard() {
  const { props } = usePage()
  const accounts = props.accounts || []
  const transactions = props.transactions || []

  const form = useForm({
    source_id: accounts[0]?.id || '',
    destination_id: accounts[1]?.id || '',
    amount: ''
  })

  const submit = (e) => {
    e.preventDefault()
    form.post(route('demo.transfer'))
  }

  const accountMap = useMemo(() => {
    const map = {}
    accounts.forEach(a => { map[a.id] = a })
    return map
  }, [accounts])

  return (
      <div className="p-6 space-y-8">
          <h1 className="text-2xl font-bold">AppDemo Demo Banking</h1>

          <section>
              <h2 className="text-xl font-semibold mb-2">Accounts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((acc) => (
                      <div
                          key={acc.id}
                          className="rounded border p-4 bg-white dark:bg-gray-900"
                      >
                          <div className="font-medium">{acc.user_name}</div>
                          <div className="text-sm text-gray-500">
                              {acc.account_number}
                          </div>
                          <div className="mt-2 text-lg">
                              {acc.balance} {acc.currency}
                          </div>
                      </div>
                  ))}
              </div>
          </section>

          <section>
              <h2 className="text-xl font-semibold mb-2">Transfer</h2>
              <form onSubmit={submit} className="space-y-3 max-w-xl">
                  <div>
                      <label className="block text-sm mb-1">
                          Source Account
                      </label>
                      <select
                          className="w-full border rounded p-2"
                          value={form.data.source_id}
                          onChange={(e) =>
                              form.setData("source_id", e.target.value)
                          }
                      >
                          {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                  {a.user_name} - {a.account_number} (
                                  {a.currency})
                              </option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm mb-1">
                          Destination Account
                      </label>
                      <select
                          className="w-full border rounded p-2"
                          value={form.data.destination_id}
                          onChange={(e) =>
                              form.setData("destination_id", e.target.value)
                          }
                      >
                          {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                  {a.user_name} - {a.account_number} (
                                  {a.currency})
                              </option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm mb-1">Amount</label>
                      <input
                          type="number"
                          step="0.01"
                          className="w-full border rounded p-2"
                          value={form.data.amount}
                          onChange={(e) =>
                              form.setData("amount", e.target.value)
                          }
                      />
                      {form.errors.amount && (
                          <p className="text-red-600 text-sm mt-1">
                              {form.errors.amount}
                          </p>
                      )}
                  </div>
                  <button
                      type="submit"
                      className="px-4 py-2 rounded bg-blue-600 text-white"
                  >
                      Transfer
                  </button>
                  {form.processing && (
                      <span className="ml-2 text-sm">Processing...</span>
                  )}
                  {props.flash?.status && (
                      <p className="text-green-600 mt-2">
                          {props.flash.status}
                      </p>
                  )}
              </form>
              <p className="text-xs text-gray-500 mt-2">
                  Note: Transfers require matching currencies. Use admin panel
                  to convert currencies.
              </p>
          </section>

          <section>
              <h2 className="text-xl font-semibold mb-2">
                  Recent Transactions
              </h2>
              <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                      <thead>
                          <tr className="text-left">
                              <th className="p-2">Account</th>
                              <th className="p-2">Type</th>
                              <th className="p-2">Amount</th>
                              <th className="p-2">Currency</th>
                              <th className="p-2">Related</th>
                              <th className="p-2">Description</th>
                              <th className="p-2">Date</th>
                          </tr>
                      </thead>
                      <tbody>
                          {transactions.map((tx) => (
                              <tr key={tx.id} className="border-t">
                                  <td className="p-2">
                                      {tx.account?.user_name} (
                                      {tx.account?.account_number})
                                  </td>
                                  <td className="p-2">{tx.type}</td>
                                  <td className="p-2">{tx.amount}</td>
                                  <td className="p-2">{tx.currency}</td>
                                  <td className="p-2">
                                      {tx.related_account
                                          ? `${tx.related_account.user_name} (${tx.related_account.account_number})`
                                          : "-"}
                                  </td>
                                  <td className="p-2">
                                      {tx.description || "-"}
                                  </td>
                                  <td className="p-2">
                                      {new Date(tx.created_at).toLocaleString()}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </section>
      </div>
  );
}
