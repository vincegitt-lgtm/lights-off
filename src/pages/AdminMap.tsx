import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonSpinner } from '@ionic/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Icons para sa Red (Report) at Yellow (Announcement)
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  adminBranch: string;
}

const AdminMap: React.FC<Props> = ({ adminBranch }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Reports (Pending lang, hindi kasama resolved)
    const qReports = query(
      collection(db, 'reports'), 
      where('branch', '==', adminBranch), 
      where('status', '==', 'pending')
    );
    const unsubReports = onSnapshot(qReports, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setReports(data);
    });

    // Fetch Announcements (Ongoing lang)
    const qAnnouncements = query(
      collection(db, 'announcements'), 
      where('branch', '==', adminBranch), 
      where('status', '==', 'ongoing')
    );
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setAnnouncements(data);
      setLoading(false);
    });

    return () => { unsubReports(); unsubAnnouncements(); };
  }, [adminBranch]);

  // Center logic base sa branch
  const getCenter = (branch: string): [number, number] => {
    switch(branch) {
      case 'Naujan': return [13.3244, 121.3066];
      case 'Socorro': return [13.0431, 121.4128];
      case 'Calapan City': return [13.4115, 121.1803];
      default: return [13.4000, 121.1833];
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" /></div>;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Live Map ({adminBranch})</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        <div style={{ height: '70vh', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
          <MapContainer center={getCenter(adminBranch)} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* PULANG PIN: Pending Reports */}
            {reports.filter(r => r.latitude && r.longitude).map((report) => (
              <Marker key={report.id} position={[report.latitude, report.longitude] as [number, number]} icon={redIcon}>
                <Popup>
                  <strong>🔴 Consumer Report</strong><br />
                  <b>{report.barangay}</b><br />
                  {report.description}
                </Popup>
              </Marker>
            ))}

            {/* DILAW NA PIN: Ongoing Announcements */}
            {announcements.filter(a => a.latitude && a.longitude).map((ann) => (
              <Marker key={ann.id} position={[ann.latitude, ann.longitude] as [number, number]} icon={yellowIcon}>
                <Popup>
                  <strong>🟡 Official Announcement</strong><br />
                  <b>{ann.title}</b><br />
                  {ann.description}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* LEGEND */}
        <div style={{ display: 'flex', gap: '15px', marginTop: '15px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: 'red', fontSize: '1.5em' }}>●</span> Pending Reports
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: 'gold', fontSize: '1.5em' }}>●</span> Official Announcements
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default AdminMap;