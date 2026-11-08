import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonInput, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonText, IonTextarea, IonIcon } from '@ionic/react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { locationOutline, informationCircleOutline } from 'ionicons/icons';

// Ayusin ang default marker icon ng Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component para makuha ang pin location
function LocationMarker({ position, setPosition, setBarangay }: { position: any, setPosition: any, setBarangay: any }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchAddress(e.latlng.lat, e.latlng.lng, setBarangay);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// Function para makuha ang Barangay mula sa Coordinates
const fetchAddress = async (lat: number, lng: number, setBarangay: any) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await res.json();
    
    if (data && data.address) {
      const brgy = data.address.village || data.address.suburb || data.address.neighbourhood || data.address.hamlet || '';
      const city = data.address.city || data.address.town || data.address.municipality || '';
      
      if (brgy) {
        setBarangay(`${brgy}, ${city}`);
      } else if (city) {
        setBarangay(city);
      } else {
        setBarangay(data.display_name.split(',')[0]);
      }
    }
  } catch (error) {
    console.error("Error fetching address:", error);
  }
};

const MyReports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [userBranch, setUserBranch] = useState('');
  const [barangay, setBarangay] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Map State
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.4000, 121.1833]);
  const [pinPosition, setPinPosition] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState('Kinukuha ang iyong lokasyon...');

  useEffect(() => {
    let unsubscribe: any;
    
    const fetchUserAndReports = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserBranch(userDoc.data().branch);
      }

      const q = query(
        collection(db, 'reports'),
        where('userId', '==', user.uid)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
        setReports(data);
      });
    };

    fetchUserAndReports();

    // Kunin ang GPS location ng user agad pagbukas ng page
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(coords);
          setPinPosition({ lat: coords[0], lng: coords[1] });
          setLocationStatus('Nakuha ang iyong lokasyon. I-tap ang mapa para ilipat ang pin kung kinakailangan.');
          
          await fetchAddress(coords[0], coords[1], setBarangay);
        },
        (err) => {
          setLocationStatus('Hindi makuha ang GPS. I-tap ang mapa para pumili ng lokasyon.');
        }
      );
    } else {
      setLocationStatus('Walang GPS support ang browser. I-tap ang mapa.');
    }

    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handleSubmit = async () => {
    if (!barangay || !description) {
      alert('Punan ang barangay at description.');
      return;
    }
    
    const finalLat = pinPosition ? pinPosition.lat : mapCenter[0];
    const finalLng = pinPosition ? pinPosition.lng : mapCenter[1];

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || 'Anonymous',
        description,
        barangay,
        branch: userBranch,
        status: 'pending',
        timestamp: serverTimestamp(),
        latitude: finalLat,
        longitude: finalLng,
      });
      alert('Na-submit ang report!');
      setBarangay(''); setDescription(''); setPinPosition(null);
    } catch (err) {
      console.error(err);
      alert('May error sa pag-submit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>My Reports</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2 style={{ fontWeight: 'bold' }}>I-report ang Brownout</h2>
        
        <div style={{ height: '300px', width: '100%', marginBottom: '10px', borderRadius: '10px', overflow: 'hidden' }}>
          <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={pinPosition} setPosition={setPinPosition} setBarangay={setBarangay} />
          </MapContainer>
        </div>
        
        {/* INFO MESSAGE CARD */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: 'var(--ion-color-light)', 
          padding: '10px 15px', 
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <IonIcon icon={informationCircleOutline} color="primary" style={{ fontSize: '1.5em', marginRight: '10px' }} />
          <IonText color="medium" style={{ fontSize: '0.9em' }}>
            {locationStatus}
          </IonText>
        </div>

        <IonList style={{ background: 'transparent' }}>
          <IonItem>
            <IonLabel position="stacked">Barangay</IonLabel>
            <IonInput value={barangay} onIonChange={e => setBarangay(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Description</IonLabel>
            <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value!)} rows={2} />
          </IonItem>
        </IonList>
        
        <IonButton expand="block" className="ion-margin-top" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Nag-submit...' : 'I-submit ang Report'}
        </IonButton>

        <h2 className="ion-margin-top" style={{ fontWeight: 'bold' }}>Aking mga Report</h2>
        {reports.length === 0 ? (
          <IonText color="medium"><p>Wala ka pang nireport.</p></IonText>
        ) : (
          reports.map((report) => (
            <IonCard key={report.id}>
              <IonCardHeader>
                <IonCardTitle>{report.barangay}</IonCardTitle>
                <IonBadge color={report.status === 'pending' ? 'warning' : report.status === 'approved' ? 'primary' : report.status === 'resolved' ? 'success' : 'danger'}>
                  {report.status.toUpperCase()}
                </IonBadge>
              </IonCardHeader>
              <IonCardContent>
                <p>{report.description}</p>
                <p style={{ fontSize: '0.8em', color: 'gray' }}>
                  <strong>Location:</strong> {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                </p>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default MyReports;