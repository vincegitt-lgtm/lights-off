import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, IonTextarea, IonText, IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { locationOutline } from 'ionicons/icons';

// LEAFLET ICONS
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function LocationMarker({ position, setPosition, setBarangay }: { position: any, setPosition: any, setBarangay: any }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchBarangay(e.latlng.lat, e.latlng.lng, setBarangay);
    },
  });
  return position === null ? null : <Marker position={position} />;
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

interface Props { adminBranch: string; }

const ManageAnnouncements: React.FC<Props> = ({ adminBranch }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('scheduled');
  const [affectedAreas, setAffectedAreas] = useState('');
  const [startTime, setStartTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    const { lat, lon } = getCoordinates(adminBranch);
    setMapCenter([lat, lon]);
    setPinPosition({ lat, lng: lon });
  }, [adminBranch]);

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!title || !description || !affectedAreas) { setError('Punan lahat ng fields.'); return; }
    setSubmitting(true);
    try {
      const finalLat = pinPosition ? pinPosition.lat : mapCenter[0];
      const finalLng = pinPosition ? pinPosition.lng : mapCenter[1];
      const startDate = new Date(startTime).toISOString();
      const endDate = new Date(endTime).toISOString();

      await addDoc(collection(db, 'announcements'), {
        title, description, type, branch: adminBranch,
        affectedAreas: affectedAreas.split(',').map((a: string) => a.trim()),
        status: 'ongoing', startTime: startDate, endTime: endDate,
        latitude: finalLat, longitude: finalLng,
        createdBy: auth.currentUser?.uid, timestamp: serverTimestamp(),
      });
      setSuccess('Matagumpay na na-post!');
      setTitle(''); setDescription(''); setAffectedAreas('');
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Add Announcement</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '20px', minHeight: '100vh' }}>
          <h2 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Add Announcement</h2>
          
          {/* MAPA */}
          <div style={{ height: '250px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #e0e0e0' }}>
            <MapContainer 
              center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}
              minZoom={10} maxZoom={18}
              maxBounds={[[12.5, 120.5], [13.8, 121.8]]} maxBoundsViscosity={1.0}
            >
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker position={pinPosition} setPosition={setPinPosition} setBarangay={setAffectedAreas} />
            </MapContainer>
          </div>
          <p style={{ fontSize: '0.85em', color: 'gray', marginBottom: '20px', textAlign: 'center' }}>
            <IonIcon icon={locationOutline} /> I-tap ang mapa para awtomatikong makuha ang Barangay.
          </p>

          {error && <IonText color="danger"><p>{error}</p></IonText>}
          {success && <IonText color="success"><p>{success}</p></IonText>}

          {/* FORM */}
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked" style={{ fontWeight: 'bold' }}>Barangay affected</IonLabel>
                <IonInput value={affectedAreas} onIonChange={e => setAffectedAreas(e.detail.value!)} placeholder="Pumili sa mapa o i-type" />
              </IonItem>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked" style={{ fontWeight: 'bold' }}>Type</IonLabel>
                <IonSelect value={type} onIonChange={e => setType(e.detail.value)}>
                  <IonSelectOption value="scheduled">Scheduled</IonSelectOption>
                  <IonSelectOption value="unexpected">Unexpected</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked" style={{ fontWeight: 'bold' }}>Title / Reason</IonLabel>
                <IonInput value={title} onIonChange={e => setTitle(e.detail.value!)} placeholder="e.g. Line maintenance" />
              </IonItem>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked" style={{ fontWeight: 'bold' }}>Description</IonLabel>
                <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value!)} rows={2} />
              </IonItem>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked" style={{ fontWeight: 'bold' }}>Start</IonLabel>
                <IonInput type="datetime-local" value={startTime} onIonChange={e => setStartTime(e.detail.value!)} />
              </IonItem>
              <IonItem lines="none" style={{ marginBottom: '20px' }}>
                <IonLabel position="stacked" style={{ fontWeight: 'bold' }}>Expected restoration</IonLabel>
                <IonInput type="datetime-local" value={endTime} onIonChange={e => setEndTime(e.detail.value!)} />
              </IonItem>
              <IonButton expand="block" onClick={handleSubmit} disabled={submitting} style={{ '--background': '#FFD600', '--color': '#000', '--border-radius': '8px', height: '50px', fontWeight: 'bold' }}>
                {submitting ? 'Publishing...' : 'Publish announcement'}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ManageAnnouncements;