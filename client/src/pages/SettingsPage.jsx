import Card from '../components/ui/Card';
import CategoryManager from '../features/categories/CategoryManager';
import NotificationSettings from '../features/notifications/NotificationSettings';

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <div className="page-heading"><div><p className="eyebrow">PREFERENCES</p><h2>Settings</h2></div></div>
      <Card><h3>Workspace settings</h3><p className="card-hint">Manage your transaction categories here. Other workspace preferences will be added in later phases.</p></Card>
      <CategoryManager />
      <NotificationSettings />
    </div>
  );
}
