import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/react';
import { homeOutline, megaphoneOutline, documentTextOutline, personCircleOutline, businessOutline, settingsOutline } from 'ionicons/icons';
import { Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

import AdminDashboard from './AdminDashboard';
import ManageAnnouncements from './ManageAnnouncements';
import ManageReports from './ManageReports';
import AdminSettings from './AdminSettings';
import AdminBranch from './AdminBranch';

const Admin: React.FC = () => {
  const [adminBranch, setAdminBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminBranch = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setAdminBranch(userDoc.data().branch);
        }
      }
      setLoading(false);
    };
    fetchAdminBranch();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  if (!adminBranch) return <div style={{ padding: '20px' }}>Walang branch na naka-assign sa account mo.</div>;

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/admin/dashboard" element={<AdminDashboard adminBranch={adminBranch} />} />
        <Route path="/admin/announcements" element={<ManageAnnouncements adminBranch={adminBranch} />} />
        <Route path="/admin/reports" element={<ManageReports adminBranch={adminBranch} />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/branch" element={<AdminBranch />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="dashboard" href="/admin/dashboard">
          <IonIcon icon={homeOutline} />
          <IonLabel style={{ fontSize: '0.7em' }}>Dashboard</IonLabel>
        </IonTabButton>
        <IonTabButton tab="announcements" href="/admin/announcements">
          <IonIcon icon={megaphoneOutline} />
          <IonLabel style={{ fontSize: '0.7em' }}>Announce</IonLabel>
        </IonTabButton>
        <IonTabButton tab="reports" href="/admin/reports">
          <IonIcon icon={documentTextOutline} />
          <IonLabel style={{ fontSize: '0.7em' }}>Reports</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/admin/settings">
          <IonIcon icon={settingsOutline} />
          <IonLabel style={{ fontSize: '0.7em' }}>Settings</IonLabel>
        </IonTabButton>
        <IonTabButton tab="branch" href="/admin/branch">
          <IonIcon icon={businessOutline} />
          <IonLabel style={{ fontSize: '0.7em' }}>Branch</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default Admin;