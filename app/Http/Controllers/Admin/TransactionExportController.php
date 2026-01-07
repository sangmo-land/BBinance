<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Response;

class TransactionExportController extends Controller
{
    public function export()
    {
        $query = Transaction::query()->with(['fromAccount', 'toAccount', 'creator']);

        // Apply search to match table search behavior
        $search = request('tableSearch');
        if (is_string($search) && strlen(trim($search)) > 0) {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('reference_number', 'like', "%{$term}%")
                  ->orWhere('type', 'like', "%{$term}%")
                  ->orWhere('status', 'like', "%{$term}%")
                  ->orWhere('description', 'like', "%{$term}%")
                  ->orWhereHas('fromAccount', function ($aq) use ($term) {
                      $aq->where('account_number', 'like', "%{$term}%");
                  })
                  ->orWhereHas('toAccount', function ($aq) use ($term) {
                      $aq->where('account_number', 'like', "%{$term}%");
                  })
                  ->orWhereHas('creator', function ($aq) use ($term) {
                      $aq->where('name', 'like', "%{$term}%");
                  });
            });
        }

        // Apply filters (type, status) matching SelectFilter definitions
        $filters = request('tableFilters', []);
        if (is_array($filters)) {
            if (!empty($filters['type'])) {
                $query->where('type', $filters['type']);
            }
            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }
        }

        // Apply sorting to match table order
        $sortCol = request('tableSortColumn');
        $sortDir = request('tableSortDirection', 'desc');
        if (is_string($sortCol) && in_array(strtolower($sortDir), ['asc','desc'])) {
            // Only allow sortable columns used in table
            $sortable = ['amount', 'converted_amount', 'exchange_rate', 'created_at'];
            $query->orderBy(in_array($sortCol, $sortable) ? $sortCol : 'created_at', $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $transactions = $query->get();

        // Match table headers & formatting exactly; stream using fputcsv for correct quoting
        $headers = [
            'Reference',
            'Type',
            'From Account',
            'To Account',
            'Amount',
            'Converted',
            'Exchange Rate',
            'Status',
            'Description',
            'Created By',
            'Date',
        ];

        return response()->streamDownload(function () use ($headers, $transactions) {
            $out = fopen('php://output', 'w');
            // Optional: BOM for Excel compatibility
            // fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers);

            foreach ($transactions as $t) {
                $amount = number_format((float) $t->amount, 2) . ' ' . ($t->from_currency ?? $t->to_currency ?? 'USD');
                $converted = $t->converted_amount !== null
                    ? (number_format((float) $t->converted_amount, 2) . ' ' . ($t->to_currency ?? 'USD'))
                    : '';

                fputcsv($out, [
                    (string) $t->reference_number,
                    (string) $t->type,
                    (string) ($t->fromAccount->account_number ?? ''),
                    (string) ($t->toAccount->account_number ?? ''),
                    $amount,
                    $converted,
                    $t->exchange_rate !== null ? (string) $t->exchange_rate : '',
                    (string) $t->status,
                    (string) ($t->description ?? ''),
                    (string) ($t->creator->name ?? ''),
                    $t->created_at ? $t->created_at->format('Y-m-d H:i:s') : '',
                ]);
            }

            fclose($out);
        }, 'transactions-' . now()->format('Y-m-d-His') . '.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
