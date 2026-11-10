import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonSpinner, IonBadge } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { addCircleOutline, sunnyOutline, rainyOutline, cloudOutline, partlySunnyOutline, waterOutline, checkmarkCircleOutline, listOutline, megaphoneOutline } from 'ionicons/icons';
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

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

interface Props { adminBranch: string; }

const AdminDashboard: React.FC<Props> = ({ adminBranch }) => {
  const [adminName, setAdminName] = useState('');
  const [stats, setStats] = useState({ ongoing: 0, pending: 0, announcements: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [verifiedReports, setVerifiedReports] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Toggle Lists
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showReports, setShowReports] = useState(false);
  
  // WEATHER STATE
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

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

    // FETCH WEATHER
    const fetchWeather = async () => {
      const [lat, lon] = getCenter(adminBranch);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=precipitation_probability_max&timezone=Asia%2FManila`);
        const data = await res.json();
        setWeather({
          temp: data.current.temperature_2m,
          code: data.current.weather_code,
          rainChance: data.daily.precipitation_probability_max[0]
        });
      } catch (error) { console.error(error); } finally { setWeatherLoading(false); }
    };
    fetchWeather();

    // FETCH PENDING REPORTS
    const qPending = query(collection(db, 'reports'), where('branch', '==', adminBranch), where('status', '==', 'pending'));
    const unsubPending = onSnapshot(qPending, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setPendingReports(data);
      setStats(prev => ({ ...prev, pending: data.length }));
    });

    // FETCH ANNOUNCEMENTS
    const qAnn = query(collection(db, 'announcements'), where('branch', '==', adminBranch));
    const unsubAnn = onSnapshot(qAnn, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setAnnouncements(data);
      setStats(prev => ({ 
        ...prev, 
        announcements: data.length, 
        ongoing: data.filter(d => d.status === 'ongoing').length, 
        resolved: data.filter(d => d.status === 'restored').length 
      }));
    });

    // FETCH VERIFIED REPORTS
    const qVerified = query(collection(db, 'reports'), where('branch', '==', adminBranch), where('status', '==', 'approved'));
    const unsubVerified = onSnapshot(qVerified, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setVerifiedReports(data);
    });

    return () => { unsubPending(); unsubAnn(); unsubVerified(); };
  }, [adminBranch]);

  const handleResolve = async (id: string) => {
    try { await updateDoc(doc(db, 'reports', id), { status: 'resolved' }); } catch (e) { console.error(e); }
  };

  const handleVerifyAndPin = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reports', id), { status: 'approved' });
      navigate('/admin/dashboard');
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id: string) => {
    try { await updateDoc(doc(db, 'reports', id), { status: 'rejected' }); } catch (e) { console.error(e); }
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return sunnyOutline;
    if (code >= 1 && code <= 3) return partlySunnyOutline;
    if (code >= 51 && code <= 67) return rainyOutline;
    if (code >= 80 && code <= 82) return rainyOutline;
    return cloudOutline;
  };

  const getWeatherText = (code: number) => {
    if (code === 0) return "Sunny";
    if (code >= 1 && code <= 3) return "Partly Cloudy";
    if (code >= 51 && code <= 67) return "Rainy";
    if (code >= 80 && code <= 82) return "Heavy Rain";
    return "Cloudy";
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" /></div>;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '20px', backgroundColor: 'var(--ion-background-color)', minHeight: '100vh' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 5px 0', color: 'var(--ion-text-color)' }}>{adminBranch} Branch</h1>
              <p style={{ color: 'gray', margin: '0' }}>Welcome back, {adminName?.split(' ')[0]}</p>
            </div>
            
            {/* WEATHER WIDGET */}
            {!weatherLoading && weather && (
              <IonCard style={{ margin: '0', borderRadius: '12px', padding: '5px 10px', textAlign: 'center', backgroundColor: 'var(--ion-card-background)' }}>
                <IonIcon icon={getWeatherIcon(weather.code)} style={{ fontSize: '2rem', color: '#FFD600' }} />
                <h2 style={{ margin: '5px 0', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--ion-text-color)' }}>{weather.temp}°C</h2>
                <p style={{ margin: '0', fontSize: '0.7em', color: 'gray' }}>{getWeatherText(weather.code)}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.7em', color: '#1976d2' }}><IonIcon icon={waterOutline} /> {weather.rainChance}%</p>
              </IonCard>
            )}
          </div>

          {/* APAT NA STATS CARDS */}
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
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--ion-text-color)', margin: '0' }}>{stats.announcements}</h1>
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
              
              {/* PULANG PIN: Verified Reports */}
              {verifiedReports.filter(a => a.latitude && a.longitude).map(a => (
                <Marker key={a.id} position={[a.latitude, a.longitude]} icon={redIcon}>
                  <Popup><strong>{a.barangay}</strong><br/>{a.description}</Popup>
                </Marker>
              ))}

              {/* DILAW NA PIN: Announcements */}
              {announcements.filter(a => a.latitude && a.longitude).map(a => (
                <Marker key={a.id} position={[a.latitude, a.longitude]} icon={yellowIcon}>
                  <Popup><strong>{a.title}</strong><br/>{a.affectedAreas?.join(', ')}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* TOGGLE BUTTONS */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <IonButton expand="block" fill="outline" color="dark" onClick={() => setShowAnnouncements(!showAnnouncements)} style={{ flex: 1 }}>
              <IonIcon slot="start" icon={megaphoneOutline} /> 
              {showAnnouncements ? 'Hide' : `Announcements (${announcements.length})`}
            </IonButton>
            <IonButton expand="block" fill="outline" color="dark" onClick={() => setShowReports(!showReports)} style={{ flex: 1 }}>
              <IonIcon slot="start" icon={listOutline} /> 
              {showReports ? 'Hide' : `Reports (${verifiedReports.length})`}
            </IonButton>
          </div>

          {/* ANNOUNCEMENTS LIST */}
          {showAnnouncements && (
            <div style={{ marginTop: '15px' }}>
              {announcements.map((ann) => (
                <IonCard key={ann.id} style={{ margin: '0 0 10px 0', borderRadius: '12px' }}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{ann.title}</h3>
                      <IonBadge color={ann.type === 'unexpected' ? 'danger' : 'warning'}>
                        {ann.type === 'unexpected' ? 'Emergency' : 'Scheduled'}
                      </IonBadge>
                    </div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>{ann.description}</p>
                    <p style={{ margin: '0', fontSize: '0.8em', color: 'gray' }}>
                      <strong>Apektado:</strong> {ann.affectedAreas?.join(', ')}
                    </p>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}

          {/* VERIFIED REPORTS LIST */}
          {showReports && (
            <div style={{ marginTop: '15px' }}>
              {verifiedReports.map((report) => (
                <IonCard key={report.id} style={{ margin: '0 0 10px 0', borderRadius: '12px' }}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{report.barangay}</h3>
                      <IonBadge color="warning">PINNED</IonBadge>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9em' }}>{report.description}</p>
                    <IonButton size="small" color="success" onClick={() => handleResolve(report.id)}>
                      <IonIcon slot="start" icon={checkmarkCircleOutline} /> Mark as Resolved
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}

          {/* PENDING REPORTS SECTION */}
          {pendingReports.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '30px', marginBottom: '15px', color: 'var(--ion-text-color)' }}>Pending Reports</h2>
              {pendingReports.map((report) => (
                <IonCard key={report.id} style={{ margin: '0 0 15px 0', borderRadius: '12px' }}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{report.barangay}</h2>
                      <IonBadge color="danger">New</IonBadge>
                    </div>
                    <p style={{ margin: '0 0 15px 0', fontSize: '0.95em' }}>{report.description}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <IonButton size="small" fill="outline" color="dark" onClick={() => handleVerifyAndPin(report.id)}>Verify</IonButton>
                      <IonButton size="small" color="warning" onClick={() => handleVerifyAndPin(report.id)}>Verify & pin</IonButton>
                      <IonButton size="small" fill="outline" color="danger" onClick={() => handleReject(report.id)}>Reject</IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </>
          )}

          <IonButton expand="block" onClick={() => navigate('/admin/announcements')} style={{ '--background': '#FFD600', '--color': '#000', '--border-radius': '12px', height: '55px', fontWeight: 'bold', marginTop: '30px' }}>
            <IonIcon slot="start" icon={addCircleOutline} /> Add announcement
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;