import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { paymentMethods } from './transactionConstants';

const labels = Object.fromEntries(paymentMethods);
export default function TransactionDetail({ transaction, onClose }) {
  if (!transaction) return null;
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><Card><div className="card-heading"><h3>Transaction details</h3><Button variant="ghost" onClick={onClose}>Close</Button></div>  <dl className="detail-list"><div><dt>Title</dt><dd>{transaction.title}</dd></div><div><dt>Amount</dt><dd>{transaction.type === 'income' ? '+' : '-'}₹{transaction.amount}</dd></div><div><dt>Type</dt><dd>{transaction.type}</dd></div><div><dt>Source</dt><dd>{transaction.isRecurring ? 'Recurring payment' : 'Manual'}</dd></div><div><dt>Category</dt><dd>{transaction.category}</dd></div><div><dt>Date</dt><dd>{transaction.date}</dd></div><div><dt>Payment method</dt><dd>{labels[transaction.paymentMethod]}</dd></div><div><dt>Notes</dt><dd>{transaction.notes || 'No notes'}</dd></div></dl></Card></div></div>;
}
