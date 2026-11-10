import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonBadge, IonIcon, IonSpinner, IonButton, IonGrid, IonRow, IonCol } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { partlySunnyOutline, sunnyOutline, rainyOutline, cloudOutline, waterOutline, logOutOutline, listOutline, megaphoneOutline, alertCircleOutline } from 'ionicons/icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

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

const Home: React.FC = () => {
  const [userBranch, setUserBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annLoading, setAnnLoading] = useState(true);

  // Reports State
  const [verifiedReports, setVerifiedReports] = useState<any[]>([]);

  // Weather State
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Toggle Lists
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showReports, setShowReports] = useState(false);

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
    let unsubAnn: any;
    let unsubVerified: any;

    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const branch = userDoc.data().branch;
          setUserBranch(branch);

          // WEATHER
          const [lat, lon] = getCenter(branch);
          try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=precipitation_probability_max&timezone=Asia%2FManila`);
            const data = await res.json();
            setWeather({
              temp: data.current.temperature_2m,
              code: data.current.weather_code,
              rainChance: data.daily.precipitation_probability_max[0]
            });
          } catch (error) { console.error(error); } finally { setWeatherLoading(false); }

          // ANNOUNCEMENTS
          const qAnn = query(collection(db, 'announcements'), where('branch', '==', branch), where('status', '==', 'ongoing'));
          unsubAnn = onSnapshot(qAnn, (snap) => {
            const data: any[] = [];
            snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
            setAnnouncements(data);
            setAnnLoading(false);
          });

          // VERIFIED REPORTS
          const qReports = query(collection(db, 'reports'), where('branch', '==', branch), where('status', '==', 'approved'));
          unsubVerified = onSnapshot(qReports, (snap) => {
            const data: any[] = [];
            snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
            setVerifiedReports(data);
          });
        }
      }
      setLoading(false);
    };

    fetchUserData();
    return () => { if (unsubAnn) unsubAnn(); if (unsubVerified) unsubVerified(); };
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
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
          <IonTitle style={{ fontWeight: 'bold' }}>LightsOff ({userBranch})</IonTitle>
          <IonButton slot="end" fill="clear" color="light" onClick={handleLogout}>
            <IonIcon icon={logOutOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '20px', backgroundColor: 'var(--ion-background-color)', minHeight: '100vh' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 5px 0', color: 'var(--ion-text-color)' }}>Hello, Resident!</h1>
              <p style={{ color: 'gray', margin: '0' }}>Stay updated with power outages.</p>
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

          {/* MAP */}
          <div style={{ height: '250px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #e0e0e0' }}>
            <MapContainer 
              center={getCenter(userBranch || 'Naujan')} zoom={11} style={{ height: '100%', width: '100%' }}
              minZoom={10} maxZoom={18}
              maxBounds={[[12.5, 120.5], [13.8, 121.8]]} maxBoundsViscosity={1.0}
            >
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {/* DILAW: Announcements */}
              {announcements.filter(a => a.latitude && a.longitude).map(a => (
                <Marker key={a.id} position={[a.latitude, a.longitude]} icon={yellowIcon}>
                  <Popup><strong>{a.title}</strong><br/>{a.affectedAreas?.join(', ')}</Popup>
                </Marker>
              ))}

              {/* PULA: Verified Reports */}
              {verifiedReports.filter(r => r.latitude && r.longitude).map(r => (
                <Marker key={r.id} position={[r.latitude, r.longitude]} icon={redIcon}>
                  <Popup><strong>{r.barangay}</strong><br/>{r.description}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* TOGGLE BUTTONS */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
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
            <div>
              {annLoading ? (
                <div style={{ textAlign: 'center' }}><IonSpinner name="crescent" /></div>
              ) : announcements.length === 0 ? (
                <p style={{ color: 'gray' }}>Walang aktibong announcements.</p>
              ) : (
                announcements.map((ann) => (
                  <IonCard key={ann.id} style={{ margin: '0 0 10px 0', borderRadius: '12px' }}>
                    <IonCardContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1rem' }}>{ann.title}</h3>
                          <p style={{ margin: '0', fontSize: '0.9em', color: 'gray' }}>{ann.description}</p>
                        </div>
                        <IonBadge color={ann.type === 'unexpected' ? 'danger' : 'warning'}>
                          {ann.type === 'unexpected' ? 'Emergency' : 'Scheduled'}
                        </IonBadge>
                      </div>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: 'gray' }}>
                        <strong>Apektado:</strong> {ann.affectedAreas?.join(', ')}
                      </p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: 'gray' }}>
                        {new Date(ann.startTime).toLocaleString()} - {new Date(ann.endTime).toLocaleTimeString()}
                      </p>
                    </IonCardContent>
                  </IonCard>
                ))
              )}
            </div>
          )}

          {/* VERIFIED REPORTS LIST */}
          {showReports && (
            <div>
              {verifiedReports.length === 0 ? (
                <p style={{ color: 'gray' }}>Walang verified reports.</p>
              ) : (
                verifiedReports.map((report) => (
                  <IonCard key={report.id} style={{ margin: '0 0 10px 0', borderRadius: '12px' }}>
                    <IonCardContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{report.barangay}</h3>
                        <IonBadge color="success">VERIFIED</IonBadge>
                      </div>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>{report.description}</p>
                      <p style={{ margin: '0', fontSize: '0.8em', color: 'gray' }}>
                        <IonIcon icon={alertCircleOutline} /> {new Date(report.timestamp?.toMillis()).toLocaleString()}
                      </p>
                    </IonCardContent>
                  </IonCard>
                ))
              )}
            </div>
          )}

          <IonButton expand="block" onClick={() => navigate('/my-reports')} style={{ '--background': '#FFD600', '--color': '#000', '--border-radius': '12px', height: '55px', fontWeight: 'bold', marginTop: '30px' }}>
            <IonIcon slot="start" icon={alertCircleOutline} /> Report an Outage
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;