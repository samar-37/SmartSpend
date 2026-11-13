import Button from '../../components/ui/Button';
import { paymentMethods } from './transactionConstants';

const paymentLabels = Object.fromEntries(paymentMethods);
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function TransactionList({ items, pagination, onEdit, onDelete, onPageChange, onView }) {
  if (!items.length) return <div className="empty-state">No transactions match your filters.</div>;
  return <div className="transaction-list">
    {items.map((item) => <article className={`transaction-row ${item.type}`} key={item.id} onClick={() => onView(item)}>
      <div className="transaction-main"><span className="transaction-title">{item.title} {item.isRecurring && <span className="recurring-badge">Recurring</span>}</span><span className="transaction-meta">{item.category} · {paymentLabels[item.paymentMethod]} · {item.date}</span></div>
      <strong className="transaction-amount">{item.type === 'income' ? '+' : '-'}{currency.format(Number(item.amount))}</strong>
      <div className="transaction-actions" onClick={(event) => event.stopPropagation()}><Button variant="ghost" onClick={() => onEdit(item)}>Edit</Button><Button variant="ghost" onClick={() => onDelete(item)}>Delete</Button></div>
    </article>)}
    {pagination.pages > 1 && <div className="pagination"><Button variant="ghost" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>Previous</Button><span>Page {pagination.page} of {pagination.pages}</span><Button variant="ghost" disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)}>Next</Button></div>}
  </div>;
}
