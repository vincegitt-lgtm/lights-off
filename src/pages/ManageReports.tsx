import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonButton, IonIcon, IonSpinner, IonModal, IonText } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { locationOutline } from 'ionicons/icons';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function PinLocationMarker({ position, setPosition }: { position: any, setPosition: any }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position} icon={blueIcon} />;
}

interface Props {
  adminBranch: string;
}

const ManageReports: React.FC<Props> = ({ adminBranch }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pin Modal State
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [pinPosition, setPinPosition] = useState<any>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'reports'), 
      where('branch', '==', adminBranch)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setReports(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [adminBranch]);

  const handleVerify = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reports', id), { status: 'approved' });
    } catch (error) {
      console.error("Error verifying:", error);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reports', id), { status: 'resolved' });
    } catch (error) {
      console.error("Error resolving:", error);
    }
  };

  const openPinModal = (report: any) => {
    setSelectedReport(report);
    setPinPosition(report.latitude && report.longitude ? { lat: report.latitude, lng: report.longitude } : null);
  };

  const savePinAndVerify = async () => {
    if (!selectedReport || !pinPosition) return;
    try {
      await updateDoc(doc(db, 'reports', selectedReport.id), { 
        status: 'approved',
        latitude: pinPosition.lat,
        longitude: pinPosition.lng
      });
      setSelectedReport(null);
      setPinPosition(null);
    } catch (error) {
      console.error("Error saving pin:", error);
    }
  };

  const getCenter = (): [number, number] => {
    switch(adminBranch) {
      case 'Naujan': return [13.3244, 121.3066];
      case 'Socorro': return [13.0431, 121.4128];
      case 'Calapan City': return [13.4115, 121.1803];
      default: return [13.4000, 121.1833];
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Reports</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111', margin: '0 0 5px 0' }}>User reports</h1>
          <p style={{ color: 'gray', marginTop: '0', marginBottom: '20px' }}>Unexpected outages reported by residents.</p>

          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" /></div>
          ) : reports.length === 0 ? (
            <p style={{ color: 'gray' }}>Walang reports.</p>
          ) : (
            reports.map((report) => (
              <IonCard key={report.id} style={{ margin: '0 0 15px 0', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{report.barangay}</h2>
                    <IonBadge color={report.status === 'pending' ? 'danger' : report.status === 'approved' ? 'warning' : 'success'}>
                      {report.status === 'pending' ? 'New' : report.status === 'approved' ? 'Verified' : 'Resolved'}
                    </IonBadge>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.95em' }}>{report.description}</p>
                  <p style={{ margin: '0 0 15px 0', fontSize: '0.8em', color: 'gray' }}>
                    {report.userName || 'Anonymous'} • {new Date(report.timestamp?.toMillis()).toLocaleString()}
                  </p>
                  
                  {report.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <IonButton size="small" fill="outline" color="dark" style={{ '--border-radius': '8px' }} onClick={() => handleVerify(report.id)}>
                        Verify
                      </IonButton>
                      <IonButton size="small" color="warning" style={{ '--border-radius': '8px', '--color': '#000' }} onClick={() => openPinModal(report)}>
                        Verify & pin
                      </IonButton>
                      <IonButton size="small" fill="outline" color="danger" style={{ '--border-radius': '8px' }} onClick={() => handleResolve(report.id)}>
                        Resolve
                      </IonButton>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>

        {/* PIN MODAL */}
        <IonModal isOpen={!!selectedReport} onDidDismiss={() => setSelectedReport(null)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Pin Location</IonTitle>
              <IonButton slot="end" fill="clear" color="light" onClick={() => setSelectedReport(null)}>Close</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ height: '60vh', width: '100%' }}>
              <MapContainer 
                center={pinPosition || getCenter()} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                minZoom={10}
                maxZoom={18}
                maxBounds={[[12.5, 120.5], [13.8, 121.8]]}
                maxBoundsViscosity={1.0}
              >
                <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                <PinLocationMarker position={pinPosition} setPosition={setPinPosition} />
              </MapContainer>
            </div>
            <div style={{ padding: '15px' }}>
              <p style={{ fontSize: '0.9em', color: 'gray', marginBottom: '10px' }}>
                <IonIcon icon={locationOutline} /> I-tap ang mapa para ilagay ang pin.
              </p>
              <IonButton expand="block" color="warning" onClick={savePinAndVerify} disabled={!pinPosition} style={{ '--color': '#000', '--border-radius': '12px' }}>
                Save Pin and Verify
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ManageReports;