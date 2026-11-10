import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonSpinner, IonModal, IonText } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { partlySunnyOutline, addCircleOutline, listOutline, alertCircleOutline, expandOutline, closeOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Ayusin ang Leaflet Marker Icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component para sa click event
function LocationMarker({ position, setPosition }: { position: any, setPosition: any }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={blueIcon}></Marker>
  );
}

interface Props {
  adminBranch: string;
}

const AdminDashboard: React.FC<Props> = ({ adminBranch }) => {
  const [adminName, setAdminName] = useState('');
  const [stats, setStats] = useState({ ongoing: 0, pending: 0, action: 0 });
  const [weatherText, setWeatherText] = useState('Fetching...');
  const [loading, setLoading] = useState(true);
  const [showMapModal, setShowMapModal] = useState(false);
  
  const [reports, setReports] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null); // Para sa pin drop
  
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

      const [lat, lon] = getCenter(adminBranch);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FManila`);
        const data = await res.json();
        const code = data.current.weather_code;
        let condition = "Clear";
        if (code > 0 && code < 50) condition = "Cloudy";
        if (code >= 51 && code <= 67) condition = "Raining";
        if (code >= 80 && code <= 82) condition = "Heavy Rain";
        if (code >= 95) condition = "Thunderstorm";
        setWeatherText(`${condition} | ${data.current.temperature_2m}°C`);
      } catch { setWeatherText('Unavailable'); }

      setLoading(false);
    };
    fetchAdminData();

    const qAnnouncements = query(collection(db, 'announcements'), where('branch', '==', adminBranch), where('status', '==', 'ongoing'));
    const unsubAnn = onSnapshot(qAnnouncements, (snap) => {
      setStats(prev => ({ ...prev, ongoing: snap.size }));
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setAnnouncements(data);
    });

    const qPending = query(collection(db, 'reports'), where('branch', '==', adminBranch), where('status', '==', 'pending'));
    const unsubPen = onSnapshot(qPending, (snap) => {
      setStats(prev => ({ ...prev, pending: snap.size }));
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setReports(data);
    });

    const qAction = query(collection(db, 'reports'), where('branch', '==', adminBranch), where('status', '==', 'approved'));
    const unsubAct = onSnapshot(qAction, (snap) => {
      setStats(prev => ({ ...prev, action: snap.size }));
    });

    return () => { unsubAnn(); unsubPen(); unsubAct(); };
  }, [adminBranch]);

  const handleUseLocation = () => {
    if (selectedLocation) {
      localStorage.setItem('pinnedLocation', JSON.stringify({ lat: selectedLocation.lat, lng: selectedLocation.lng }));
      setShowMapModal(false);
      navigate('/admin/announcements');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" /></div>;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '5px', color: 'var(--ion-text-color)' }}>
          Hi, {adminName?.split(' ')[0]}!
        </h1>
        <p style={{ color: 'gray', marginTop: '0' }}>Here's the status of {adminBranch}.</p>

        <IonCard style={{ backgroundColor: 'var(--app-navy)', borderLeft: '5px solid var(--app-yellow)', margin: '20px 0' }}>
          <IonCardHeader>
            <IonCardSubtitle style={{ color: 'var(--app-yellow)', fontWeight: 'bold', letterSpacing: '1px' }}>
              <IonIcon icon={partlySunnyOutline} /> CURRENT WEATHER
            </IonCardSubtitle>
            <IonCardTitle style={{ color: '#ffffff', fontSize: '1.8rem', fontWeight: '800', marginTop: '5px' }}>
              {weatherText}
            </IonCardTitle>
          </IonCardHeader>
        </IonCard>

        <IonGrid className="ion-no-padding">
          <IonRow>
            <IonCol size="4">
              <IonCard style={{ backgroundColor: 'var(--app-navy)', margin: '0', textAlign: 'center', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '15px 5px' }}>
                  <h1 style={{ color: 'var(--app-yellow)', fontSize: '2.2rem', fontWeight: '800', margin: '0' }}>{stats.ongoing}</h1>
                  <p style={{ color: '#ffffff', fontSize: '0.75rem', margin: '5px 0 0 0', opacity: 0.8 }}>Active</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="4">
              <IonCard style={{ backgroundColor: 'var(--app-navy)', margin: '0', textAlign: 'center', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '15px 5px' }}>
                  <h1 style={{ color: 'var(--app-yellow)', fontSize: '2.2rem', fontWeight: '800', margin: '0' }}>{stats.pending}</h1>
                  <p style={{ color: '#ffffff', fontSize: '0.75rem', margin: '5px 0 0 0', opacity: 0.8 }}>Pending</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="4">
              <IonCard style={{ backgroundColor: 'var(--app-navy)', margin: '0', textAlign: 'center', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '15px 5px' }}>
                  <h1 style={{ color: 'var(--app-yellow)', fontSize: '2.2rem', fontWeight: '800', margin: '0' }}>{stats.action}</h1>
                  <p style={{ color: '#ffffff', fontSize: '0.75rem', margin: '5px 0 0 0', opacity: 0.8 }}>To Fix</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* MINI MAP */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <h2 style={{ fontWeight: '800', margin: 0 }}>Live Branch Map</h2>
          <IonButton size="small" fill="outline" onClick={() => setShowMapModal(true)}>
            <IonIcon slot="start" icon={expandOutline} /> Expand
          </IonButton>
        </div>
        
        <div style={{ height: '250px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginTop: '10px', border: '2px solid var(--app-navy)' }}>
          <MapContainer center={getCenter(adminBranch)} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
            
            {reports.filter(r => r.latitude && r.longitude).map(r => (
              <Marker key={r.id} position={[r.latitude, r.longitude]} icon={redIcon}>
                <Popup><strong>🔴 Report</strong><br/>{r.barangay}</Popup>
              </Marker>
            ))}

            {announcements.filter(a => a.latitude && a.longitude).map(a => (
              <Marker key={a.id} position={[a.latitude, a.longitude]} icon={yellowIcon}>
                <Popup><strong>🟡 Announcement</strong><br/>{a.title}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <h2 className="ion-margin-top" style={{ fontWeight: '800', marginBottom: '15px' }}>Quick Actions</h2>
        
        <IonButton expand="block" onClick={() => navigate('/admin/announcements')} style={{ '--background': 'var(--app-yellow)', '--color': '#000000', '--border-radius': '10px', height: '50px', fontWeight: 'bold', marginBottom: '10px' }}>
          <IonIcon slot="start" icon={addCircleOutline} /> Post New Announcement
        </IonButton>
        
        <IonButton expand="block" fill="outline" onClick={() => navigate('/admin/reports')} style={{ '--border-color': 'var(--app-navy)', '--color': 'var(--app-navy)', '--border-radius': '10px', height: '50px', fontWeight: 'bold', marginBottom: '10px' }}>
          <IonIcon slot="start" icon={listOutline} /> Review Pending Reports
        </IonButton>
        
        <IonButton expand="block" fill="outline" onClick={() => navigate('/admin/action')} style={{ '--border-color': 'var(--app-navy)', '--color': 'var(--app-navy)', '--border-radius': '10px', height: '50px', fontWeight: 'bold' }}>
          <IonIcon slot="start" icon={alertCircleOutline} /> Action Required
        </IonButton>

        {/* FULL MAP MODAL WITH PIN DROP */}
        <IonModal isOpen={showMapModal} onDidDismiss={() => { setShowMapModal(false); setSelectedLocation(null); }}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Branch Map</IonTitle>
              <IonButton slot="end" fill="clear" color="light" onClick={() => { setShowMapModal(false); setSelectedLocation(null); }}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ height: '75vh', width: '100%' }}>
              <MapContainer center={getCenter(adminBranch)} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                
                {reports.filter(r => r.latitude && r.longitude).map(r => (
                  <Marker key={r.id} position={[r.latitude, r.longitude]} icon={redIcon}>
                    <Popup><strong>🔴 Report</strong><br/>{r.barangay}<br/>{r.description}</Popup>
                  </Marker>
                ))}

                {announcements.filter(a => a.latitude && a.longitude).map(a => (
                  <Marker key={a.id} position={[a.latitude, a.longitude]} icon={yellowIcon}>
                    <Popup><strong>🟡 Announcement</strong><br/>{a.title}<br/>{a.description}</Popup>
                  </Marker>
                ))}
                
                {/* PIN DROP FEATURE */}
                <LocationMarker position={selectedLocation} setPosition={setSelectedLocation} />
              </MapContainer>
            </div>

            {selectedLocation && (
              <div style={{ padding: '15px' }}>
                <IonText color="medium">
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.9em' }}>
                    📍 Pin Location: Lat {selectedLocation.lat.toFixed(4)}, Lng {selectedLocation.lng.toFixed(4)}
                  </p>
                </IonText>
                <IonButton expand="block" color="success" onClick={handleUseLocation}>
                  Use This Location for Announcement
                </IonButton>
              </div>
            )}

          </IonContent>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;