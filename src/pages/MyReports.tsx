import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonBadge, IonButton, IonIcon, IonSpinner, IonItem, IonLabel, IonInput, IonTextarea } from '@ionic/react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { locationOutline } from 'ionicons/icons';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// LEAFLET ICONS
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

function LocationMarker({ position, setPosition, setBarangay }: { position: any, setPosition: any, setBarangay: any }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchBarangay(e.latlng.lat, e.latlng.lng, setBarangay);
    },
  });
  return position === null ? null : <Marker position={position} icon={blueIcon} />;
}

const fetchBarangay = async (lat: number, lng: number, setBarangay: any) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await res.json();
    if (data && data.address) {
      const brgy = data.address.village || data.address.suburb || data.address.neighbourhood || data.address.hamlet || '';
      if (brgy) setBarangay(brgy);
    }
  } catch (error) { console.error(error); }
};

const MyReports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBranch, setUserBranch] = useState('');
  const [barangay, setBarangay] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [submitting, setSubmitting] = useState(false);
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.4000, 121.1833]);
  const [pinPosition, setPinPosition] = useState<any>(null);

  useEffect(() => {
    let unsubscribe: any;
    const fetchUserAndReports = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // KUNAIN ANG BRANCH NG USER
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const branch = userDoc.data().branch;
        setUserBranch(branch);
        // I-set ang map center base sa branch
        switch(branch) {
          case 'Naujan': setMapCenter([13.3244, 121.3066]); break;
          case 'Socorro': setMapCenter([13.0431, 121.4128]); break;
          case 'Calapan City': setMapCenter([13.4115, 121.1803]); break;
          default: setMapCenter([13.4000, 121.1833]);
        }
      }

      const q = query(collection(db, 'reports'), where('userId', '==', user.uid));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data: any[] = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
        setReports(data);
        setLoading(false);
      });
    };
    fetchUserAndReports();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(coords);
          setPinPosition({ lat: coords[0], lng: coords[1] });
          await fetchBarangay(coords[0], coords[1], setBarangay);
        },
        () => {}
      );
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handleSubmit = async () => {
    if (!barangay || !description) {
      alert('Punan ang barangay at description.');
      return;
    }
    if (!userBranch) {
      alert('Walang branch na naka-assign sa account mo. I-update ang profile.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || 'Anonymous',
        description,
        barangay,
        branch: userBranch, // <-- SIGURADONG MAY VALUE
        status: 'pending',
        startTime: new Date(startTime).toISOString(),
        timestamp: serverTimestamp(),
        latitude: pinPosition ? pinPosition.lat : mapCenter[0],
        longitude: pinPosition ? pinPosition.lng : mapCenter[1],
      });
      alert('Na-submit ang report!');
      setBarangay(''); setDescription(''); setStartTime(new Date().toISOString().slice(0, 16));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'approved': return 'primary';
      case 'resolved': return 'success';
      case 'rejected': return 'danger';
      default: return 'medium';
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" /></div>;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>My Reports</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '20px', backgroundColor: 'var(--ion-background-color)', minHeight: '100vh' }}>
          
          {/* MAP */}
          <div style={{ height: '200px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '10px', border: '1px solid #e0e0e0' }}>
            <MapContainer 
              center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}
              minZoom={10} maxZoom={18}
              maxBounds={[[12.5, 120.5], [13.8, 121.8]]} maxBoundsViscosity={1.0}
            >
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker position={pinPosition} setPosition={setPinPosition} setBarangay={setBarangay} />
            </MapContainer>
          </div>
          <p style={{ fontSize: '0.85em', color: 'gray', marginBottom: '20px', textAlign: 'center' }}>
            <IonIcon icon={locationOutline} /> I-tap ang mapa para awtomatikong makuha ang Barangay.
          </p>

          {/* FORM */}
          <IonCard style={{ marginBottom: '20px', borderRadius: '12px' }}>
            <IonCardContent>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked">Barangay affected</IonLabel>
                <IonInput value={barangay} onIonChange={e => setBarangay(e.detail.value!)} />
              </IonItem>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value!)} rows={2} />
              </IonItem>
              <IonItem lines="none" style={{ marginBottom: '20px' }}>
                <IonLabel position="stacked">Start Time</IonLabel>
                <IonInput type="datetime-local" value={startTime} onIonChange={e => setStartTime(e.detail.value!)} />
              </IonItem>
              <IonButton expand="block" onClick={handleSubmit} disabled={submitting} style={{ '--background': '#FFD600', '--color': '#000', '--border-radius': '8px', height: '50px', fontWeight: 'bold' }}>
                {submitting ? 'Nag-submit...' : 'Submit Report'}
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* MY REPORTS LIST */}
          <h2 style={{ fontWeight: 'bold', color: 'var(--ion-text-color)', marginBottom: '10px' }}>My Reports</h2>
          
          {reports.length === 0 ? (
            <p style={{ color: 'gray' }}>Wala ka pang nireport.</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {reports.map((report) => (
                <IonCard key={report.id} style={{ marginBottom: '10px', borderRadius: '12px' }}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{report.barangay}</h3>
                      <IonBadge color={getStatusColor(report.status)}>{report.status.toUpperCase()}</IonBadge>
                    </div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>{report.description}</p>
                    <p style={{ margin: 0, fontSize: '0.8em', color: 'gray' }}>
                      Start: {new Date(report.startTime).toLocaleString()}
                    </p>
                    {report.status === 'rejected' && report.rejectReason && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: 'red' }}>
                        <strong>Reason:</strong> {report.rejectReason}
                      </p>
                    )}
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
};

export default MyReports;