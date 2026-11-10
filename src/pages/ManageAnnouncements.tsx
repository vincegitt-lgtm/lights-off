import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, IonTextarea, IonText, IonCard, IonCardContent, IonIcon, IonSpinner } from '@ionic/react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { locationOutline } from 'ionicons/icons';

// --- LEAFLET ICONS SETUP ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component para sa pin location at click event
function LocationMarker({ position, setPosition, setBarangay }: { position: any, setPosition: any, setBarangay: any }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchBarangay(e.latlng.lat, e.latlng.lng, setBarangay);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// Function para makuha ang Barangay name base sa coordinates
const fetchBarangay = async (lat: number, lng: number, setBarangay: any) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await res.json();
    
    if (data && data.address) {
      const brgy = data.address.village || data.address.suburb || data.address.neighbourhood || data.address.hamlet || '';
      if (brgy) {
        setBarangay(brgy); // Awtomatikong ise-set ang Barangay dropdown
      }
    }
  } catch (error) {
    console.error("Error fetching barangay:", error);
  }
};

interface Props {
  adminBranch: string;
}

const ManageAnnouncements: React.FC<Props> = ({ adminBranch }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('scheduled');
  const [affectedAreas, setAffectedAreas] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString());
  const [startTime, setStartTime] = useState<string>(new Date().toISOString());
  const [endTime, setEndTime] = useState<string>(new Date().toISOString());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Map State
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.4000, 121.1833]);
  const [pinPosition, setPinPosition] = useState<any>(null);

  const getCoordinates = (branch: string) => {
    switch(branch) {
      case 'Naujan': return { lat: 13.3244, lon: 121.3066 };
      case 'Socorro': return { lat: 13.0431, lon: 121.4128 };
      case 'Calapan City': return { lat: 13.4115, lon: 121.1803 };
      default: return { lat: 13.4000, lon: 121.1833 };
    }
  };

  useEffect(() => {
    // Initialize map center base sa admin branch
    const { lat, lon } = getCoordinates(adminBranch);
    setMapCenter([lat, lon]);
    setPinPosition({ lat, lng: lon });

    const q = query(
      collection(db, 'announcements'),
      where('branch', '==', adminBranch)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
      setAnnouncements(data);
    });
    return () => unsubscribe();
  }, [adminBranch]);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!title || !description || !affectedAreas) {
      setError('Punan ang Title, Description, at Affected Barangay.');
      return;
    }

    setSubmitting(true);

    try {
      const finalLat = pinPosition ? pinPosition.lat : mapCenter[0];
      const finalLng = pinPosition ? pinPosition.lng : mapCenter[1];

      await addDoc(collection(db, 'announcements'), {
        title,
        description,
        type,
        branch: adminBranch,
        affectedAreas: affectedAreas.split(',').map(area => area.trim()),
        status: 'ongoing',
        scheduledDate: scheduledDate,
        startTime: startTime,
        endTime: endTime,
        latitude: finalLat,
        longitude: finalLng,
        createdBy: auth.currentUser?.uid,
        timestamp: serverTimestamp(),
      });
      setSuccess('Matagumpay na na-post ang announcement!');
      setTitle(''); setDescription(''); setAffectedAreas('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'announcements', id), { status: newStatus });
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Add Announcement</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        <h2 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Add Announcement</h2>

        {/* MAPA DITO SA TAAS */}
        <div style={{ height: '250px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', border: '2px solid #e0e0e0' }}>
          <MapContainer 
            center={mapCenter} 
            zoom={11} 
            style={{ height: '100%', width: '100%' }}
            minZoom={10}
            maxZoom={18}
            maxBounds={[
              [12.5, 120.5], // Southwest Oriental Mindoro
              [13.8, 121.8]  // Northeast Oriental Mindoro
            ]}
            maxBoundsViscosity={1.0}
          >
            <TileLayer 
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution='&copy; OpenStreetMap' 
            />
            <LocationMarker position={pinPosition} setPosition={setPinPosition} setBarangay={setAffectedAreas} />
          </MapContainer>
        </div>
        <p style={{ fontSize: '0.85em', color: 'gray', marginTop: '-10px', marginBottom: '20px', textAlign: 'center' }}>
          <IonIcon icon={locationOutline} /> I-tap ang mapa para awtomatikong makuha ang Barangay.
        </p>

        {error && <IonText color="danger"><p>{error}</p></IonText>}
        {success && <IonText color="success"><p>{success}</p></IonText>}

        <IonCard style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <IonCardContent>
            
            <IonItem lines="none" style={{ marginBottom: '10px' }}>
              <IonLabel position="stacked" style={{ fontWeight: 'bold', color: '#000' }}>Barangay affected</IonLabel>
              <IonInput 
                value={affectedAreas} 
                onIonChange={e => setAffectedAreas(e.detail.value!)} 
                placeholder="Pumili sa mapa o i-type"
                style={{ '--background': '#f0f0f0', '--padding-start': '10px', borderRadius: '8px' }}
              />
            </IonItem>

            <IonItem lines="none" style={{ marginBottom: '10px' }}>
              <IonLabel position="stacked" style={{ fontWeight: 'bold', color: '#000' }}>Type</IonLabel>
              <IonSelect 
                value={type} 
                onIonChange={e => setType(e.detail.value)}
                style={{ '--background': '#f0f0f0', '--padding-start': '10px', borderRadius: '8px', width: '100%' }}
              >
                <IonSelectOption value="scheduled">Scheduled</IonSelectOption>
                <IonSelectOption value="unexpected">Unexpected</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem lines="none" style={{ marginBottom: '10px' }}>
              <IonLabel position="stacked" style={{ fontWeight: 'bold', color: '#000' }}>Title / Reason</IonLabel>
              <IonInput 
                value={title} 
                onIonChange={e => setTitle(e.detail.value!)} 
                placeholder="e.g. Line maintenance"
                style={{ '--background': '#f0f0f0', '--padding-start': '10px', borderRadius: '8px' }}
              />
            </IonItem>

            <IonItem lines="none" style={{ marginBottom: '10px' }}>
              <IonLabel position="stacked" style={{ fontWeight: 'bold', color: '#000' }}>Description</IonLabel>
              <IonTextarea 
                value={description} 
                onIonChange={e => setDescription(e.detail.value!)} 
                rows={2}
                style={{ '--background': '#f0f0f0', '--padding-start': '10px', borderRadius: '8px' }}
              />
            </IonItem>

            <IonItem lines="none" style={{ marginBottom: '10px' }}>
              <IonLabel position="stacked" style={{ fontWeight: 'bold', color: '#000' }}>Start</IonLabel>
              <IonInput 
                type="datetime-local" 
                value={startTime.substring(0, 16)} 
                onIonChange={e => setStartTime(e.detail.value!)} 
                style={{ '--background': '#f0f0f0', '--padding-start': '10px', borderRadius: '8px' }}
              />
            </IonItem>

            <IonItem lines="none" style={{ marginBottom: '20px' }}>
              <IonLabel position="stacked" style={{ fontWeight: 'bold', color: '#000' }}>Expected restoration</IonLabel>
              <IonInput 
                type="datetime-local" 
                value={endTime.substring(0, 16)} 
                onIonChange={e => setEndTime(e.detail.value!)} 
                style={{ '--background': '#f0f0f0', '--padding-start': '10px', borderRadius: '8px' }}
              />
            </IonItem>

            <IonButton 
              expand="block" 
              onClick={handleSubmit} 
              disabled={submitting}
              style={{ '--background': '#FFC107', '--color': '#000000', '--border-radius': '8px', height: '50px', fontWeight: 'bold' }}
            >
              {submitting ? 'Publishing...' : 'Publish announcement'}
            </IonButton>

          </IonCardContent>
        </IonCard>

        <h2 className="ion-margin-top" style={{ fontWeight: 'bold' }}>Current Announcements</h2>
        {announcements.length === 0 ? <p>Walang announcements.</p> : (
          announcements.map((ann) => (
            <IonCard key={ann.id}>
              <IonCardContent>
                <h3 style={{ fontWeight: 'bold' }}>{ann.title}</h3>
                <IonText color="medium"><p>{ann.description}</p></IonText>
                <p style={{ fontSize: '0.85em', color: 'gray' }}>
                  <strong>Barangay:</strong> {ann.affectedAreas?.join(', ')}<br/>
                  <strong>Start:</strong> {new Date(ann.startTime).toLocaleString()}<br/>
                  <strong>End:</strong> {new Date(ann.endTime).toLocaleString()}
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <IonButton size="small" color="success" onClick={() => updateStatus(ann.id, 'restored')}>Mark as Restored</IonButton>
                  <IonButton size="small" color="danger" onClick={() => updateStatus(ann.id, 'cancelled')}>Cancel</IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}

      </IonContent>
    </IonPage>
  );
};

export default ManageAnnouncements;