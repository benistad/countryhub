import { SEOHead } from '../components/SEOHead';
import AdminPanel from '../components/AdminPanel';

export default function AdminPage() {
  return (
    <div>
      <SEOHead 
        title="Admin Panel | CountryMusic-Hub.com"
        description="Administration panel for CountryMusic-Hub.com"
        canonical="/admin"
        noindex={true}
      />
      <AdminPanel />
    </div>
  );
}
