import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonSpinner, IonBadge } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { addCircleOutline, trashOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// LEAFLET ICONS
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

interface Props { adminBranch: string; }

const AdminDashboard: React.FC<Props> = ({ adminBranch }) => {
  const [adminName, setAdminName] = useState('');
  const [stats, setStats] = useState({ ongoing: 0, pending: 0, announcements: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  
  const navigate = useNavigate();

  const getCenter = (branch: string): [number, number] => {
    switch(branch) {
      case 'Naujan': return [13.3244, 121.3066];
      case 'Socorro': return [13.0431, 121.4128];
      case 'Calapan City': return [13.4115, 121.1803];
      default: return [13.4000, 121.1833];
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) setAdminName(userDoc.data().name);
      }
      setLoading(false);
    };
    fetchAdminData();

    const qAnn = query(collection(db, 'announcements'), where('branch', '==', adminBranch));
    const unsubAnn = onSnapshot(qAnn, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setAnnouncements(data);
      setStats(prev => ({ ...prev, announcements: data.length, ongoing: data.filter(d => d.status === 'ongoing').length, resolved: data.filter(d => d.status === 'restored').length }));
    });

    const qPending = query(collection(db, 'reports'), where('branch', '==', adminBranch), where('status', '==', 'pending'));
    const unsubPending = onSnapshot(qPending, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setPendingReports(data);
      setStats(prev => ({ ...prev, pending: data.length }));
    });

    return () => { unsubAnn(); unsubPending(); };
  }, [adminBranch]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Burahin ito?')) {
      try { await deleteDoc(doc(db, 'announcements', id)); } catch (e) { console.error(e); }
    }
  };

  const handleRestore = async (id: string) => {
    try { await updateDoc(doc(db, 'announcements', id), { status: 'restored' }); } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" /></div>;

  // FILTER: Ipakita lang ang marker kung "ongoing" AT hindi pa tapos ang endTime
  const activeMarkers = announcements.filter(a => {
    if (!a.latitude || !a.longitude) return false;
    if (a.status !== 'ongoing') return false;
    if (a.endTime) {
      const end = new Date(a.endTime).getTime();
      if (end < Date.now()) return false; // Tapos na ang oras
    }
    return true;
  });

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '20px', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 5px 0' }}>
            {adminBranch} Branch
          </h1>
          <p style={{ color: 'gray', marginTop: '0', marginBottom: '20px' }}>Welcome back, {adminName?.split(' ')[0]}</p>

          <IonGrid className="ion-no-padding">
            <IonRow>
              <IonCol size="6" style={{ padding: '5px' }}>
                <IonCard style={{ margin: '0', borderRadius: '12px' }}>
                  <IonCardContent style={{ padding: '15px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d32f2f', margin: '0' }}>{stats.ongoing}</h1>
                    <p style={{ fontSize: '0.9rem', color: 'gray', margin: '5px 0 0 0' }}>Active outages</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6" style={{ padding: '5px' }}>
                <IonCard style={{ margin: '0', borderRadius: '12px' }}>
                  <IonCardContent style={{ padding: '15px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1976d2', margin: '0' }}>{stats.pending}</h1>
                    <p style={{ fontSize: '0.9rem', color: 'gray', margin: '5px 0 0 0' }}>New reports</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6" style={{ padding: '5px' }}>
                <IonCard style={{ margin: '0', borderRadius: '12px' }}>
                  <IonCardContent style={{ padding: '15px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0' }}>{stats.announcements}</h1>
                    <p style={{ fontSize: '0.9rem', color: 'gray', margin: '5px 0 0 0' }}>Announcements</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6" style={{ padding: '5px' }}>
                <IonCard style={{ margin: '0', borderRadius: '12px' }}>
                  <IonCardContent style={{ padding: '15px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#388e3c', margin: '0' }}>{stats.resolved}</h1>
                    <p style={{ fontSize: '0.9rem', color: 'gray', margin: '5px 0 0 0' }}>Resolved</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* MAP */}
          <div style={{ height: '250px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginTop: '20px', border: '1px solid #e0e0e0' }}>
            <MapContainer 
              center={getCenter(adminBranch)} zoom={11} style={{ height: '100%', width: '100%' }}
              minZoom={10} maxZoom={18}
              maxBounds={[[12.5, 120.5], [13.8, 121.8]]} maxBoundsViscosity={1.0}
            >
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {/* Gagamitin natin ang activeMarkers (filtered) */}
              {activeMarkers.map(a => (
                <Marker key={a.id} position={[a.latitude, a.longitude]} icon={redIcon}>
                  <Popup><strong>{a.title}</strong><br/>{a.affectedAreas?.join(', ')}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* PENDING REPORTS */}
          {pendingReports.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '30px', marginBottom: '15px' }}>Pending Reports</h2>
              {pendingReports.map((report) => (
                <IonCard key={report.id} style={{ margin: '0 0 15px 0', borderRadius: '12px' }}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{report.barangay}</h2>
                      <IonBadge color="danger">New</IonBadge>
                    </div>
                    <p style={{ margin: '0 0 15px 0', fontSize: '0.95em' }}>{report.description}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <IonButton size="small" fill="outline" color="dark" onClick={() => updateDoc(doc(db, 'reports', report.id), { status: 'approved' })}>Verify</IonButton>
                      <IonButton size="small" color="warning" onClick={() => {
                        updateDoc(doc(db, 'reports', report.id), { status: 'approved' });
                        navigate('/admin/dashboard');
                      }}>Verify & pin</IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </>
          )}

          {/* LATEST ANNOUNCEMENTS */}
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '30px', marginBottom: '15px' }}>Latest announcements</h2>
          {announcements.slice(0, 3).map((ann) => (
            <IonCard key={ann.id} style={{ margin: '0 0 10px 0', borderRadius: '12px' }}>
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1rem' }}>{ann.title}</h3>
                    <p style={{ margin: '0', fontSize: '0.9em', color: 'gray' }}>{ann.description}</p>
                  </div>
                  <IonBadge color={ann.type === 'unexpected' ? 'danger' : 'warning'}>{ann.type === 'unexpected' ? 'Emergency' : 'Scheduled'}</IonBadge>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <IonButton size="small" fill="outline" color="dark" onClick={() => handleRestore(ann.id)}>Mark restored</IonButton>
                  <IonButton size="small" fill="outline" color="danger" onClick={() => handleDelete(ann.id)}><IonIcon slot="start" icon={trashOutline} /> Delete</IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))}

          <IonButton expand="block" onClick={() => navigate('/admin/announcements')} style={{ '--background': '#FFD600', '--color': '#000', '--border-radius': '12px', height: '55px', fontWeight: 'bold', marginTop: '30px' }}>
            <IonIcon slot="start" icon={addCircleOutline} /> Add announcement
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;