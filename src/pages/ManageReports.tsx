import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonBadge, IonButton, IonIcon, IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonActionSheet, IonAlert } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { downloadOutline, documentTextOutline, megaphoneOutline, layersOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  adminBranch: string;
}

const ManageReports: React.FC<Props> = ({ adminBranch }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [mainFilter, setMainFilter] = useState<'reports' | 'announcements'>('reports');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'resolved' | 'rejected'>('pending');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRejectAlert, setShowRejectAlert] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    // TANGGALIN ANG status FILTER SA QUERY PARA LAHAT NG REPORTS NG BRANCH MAKUHA
    const qReports = query(
      collection(db, 'reports'), 
      where('branch', '==', adminBranch)
    );
    const unsubReports = onSnapshot(qReports, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setReports(data);
    });

    const qAnn = query(collection(db, 'announcements'), where('branch', '==', adminBranch));
    const unsubAnn = onSnapshot(qAnn, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setAnnouncements(data);
      setLoading(false);
    });

    return () => { unsubReports(); unsubAnn(); };
  }, [adminBranch]);

  // --- ACTIONS ---
  const handleVerifyAndPin = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reports', id), { 
        status: 'approved' 
      });
    } catch (e) { console.error(e); }
  };

  const handleResolve = async (id: string) => {
    try { await updateDoc(doc(db, 'reports', id), { status: 'resolved' }); } catch (e) { console.error(e); }
  };

  const triggerReject = (id: string) => {
    setSelectedReportId(id);
    setShowRejectAlert(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!selectedReportId) return;
    try {
      await updateDoc(doc(db, 'reports', selectedReportId), { 
        status: 'rejected',
        rejectReason: reason
      });
      setShowRejectAlert(false);
      setSelectedReportId(null);
    } catch (e) { console.error(e); }
  };

  // --- PDF EXPORT ---
  const downloadPDF = (type: 'reports' | 'announcements' | 'both') => {
    setShowExportMenu(false);
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`LightsOff History - ${adminBranch}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    let startY = 35;

    if (type === 'reports' || type === 'both') {
      doc.setFontSize(14);
      doc.text("User Reports", 14, startY);
      startY += 5;
      const reportData = reports.map(r => [r.barangay, r.description, r.status.toUpperCase(), new Date(r.timestamp?.toMillis()).toLocaleDateString()]);
      autoTable(doc, { startY, head: [['Barangay', 'Description', 'Status', 'Date']], body: reportData, theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [0, 200, 83] } });
      startY = (doc as any).lastAutoTable.finalY + 15;
    }

    if (type === 'announcements' || type === 'both') {
      if (startY > 250) { doc.addPage(); startY = 20; }
      doc.setFontSize(14);
      doc.text("Announcements", 14, startY);
      startY += 5;
      const annData = announcements.map(a => [a.title, a.affectedAreas?.join(', '), a.status.toUpperCase(), new Date(a.startTime).toLocaleDateString()]);
      autoTable(doc, { startY, head: [['Title', 'Barangay', 'Status', 'Start Date']], body: annData, theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [255, 214, 0], textColor: [0, 0, 0] } });
    }

    doc.save(`LightsOff_${adminBranch}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" /></div>;

  // Filter reports base sa status (client-side)
  const filteredReports = reports.filter(r => r.status === statusFilter);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Reports & History</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '20px', minHeight: '100vh' }}>
          
          {/* MAIN TABS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <IonSegment value={mainFilter} onIonChange={e => setMainFilter(e.detail.value as any)} style={{ flex: 1, marginRight: '10px' }}>
              <IonSegmentButton value="reports"><IonLabel>Reports</IonLabel></IonSegmentButton>
              <IonSegmentButton value="announcements"><IonLabel>Announcements</IonLabel></IonSegmentButton>
            </IonSegment>

            <IonButton fill="solid" color="success" onClick={() => setShowExportMenu(true)}>
              <IonIcon slot="start" icon={downloadOutline} /> PDF
            </IonButton>
          </div>

          {mainFilter === 'reports' ? (
            <>
              {/* SUB-TABS PARA SA REPORTS */}
              <IonSegment value={statusFilter} onIonChange={e => setStatusFilter(e.detail.value as any)} style={{ marginBottom: '20px' }}>
                <IonSegmentButton value="pending"><IonLabel>Pending</IonLabel></IonSegmentButton>
                <IonSegmentButton value="approved"><IonLabel>Verified</IonLabel></IonSegmentButton>
                <IonSegmentButton value="resolved"><IonLabel>Resolved</IonLabel></IonSegmentButton>
                <IonSegmentButton value="rejected"><IonLabel>Rejected</IonLabel></IonSegmentButton>
              </IonSegment>

              {filteredReports.length === 0 ? <p style={{ color: 'gray' }}>Walang reports sa status na ito.</p> : (
                filteredReports.map((report) => (
                  <IonCard key={report.id} style={{ margin: '0 0 15px 0', borderRadius: '12px' }}>
                    <IonCardContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{report.barangay}</h2>
                        <IonBadge color={
                          report.status === 'pending' ? 'danger' : 
                          report.status === 'approved' ? 'warning' : 
                          report.status === 'resolved' ? 'success' : 'medium'
                        }>
                          {report.status.toUpperCase()}
                        </IonBadge>
                      </div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.95em' }}>{report.description}</p>
                      <p style={{ margin: '0 0 15px 0', fontSize: '0.8em', color: 'gray' }}>
                        {report.userName || 'Anonymous'} • {new Date(report.timestamp?.toMillis()).toLocaleString()}
                      </p>

                      {/* BUTTONS BASE SA STATUS */}
                      {report.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <IonButton size="small" color="success" onClick={() => handleVerifyAndPin(report.id)}>
                            <IonIcon slot="start" icon={checkmarkCircleOutline} /> Verify & Pin
                          </IonButton>
                          <IonButton size="small" color="danger" onClick={() => triggerReject(report.id)}>
                            <IonIcon slot="start" icon={closeCircleOutline} /> Reject
                          </IonButton>
                        </div>
                      )}

                      {report.status === 'approved' && (
                        <IonButton size="small" color="primary" onClick={() => handleResolve(report.id)}>
                          Mark as Resolved
                        </IonButton>
                      )}

                      {report.status === 'rejected' && report.rejectReason && (
                        <p style={{ fontSize: '0.8em', color: '#d32f2f', marginTop: '10px' }}>
                          <strong>Reason:</strong> {report.rejectReason}
                        </p>
                      )}
                    </IonCardContent>
                  </IonCard>
                ))
              )}
            </>
          ) : (
            announcements.length === 0 ? <p style={{ color: 'gray' }}>Walang announcements.</p> : (
              announcements.map((ann) => (
                <IonCard key={ann.id} style={{ margin: '0 0 15px 0', borderRadius: '12px' }}>
                  <IonCardContent>
                    <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{ann.title}</h2>
                    <p style={{ margin: '5px 0', fontSize: '0.9em' }}>{ann.description}</p>
                    <p style={{ margin: '5px 0', fontSize: '0.8em', color: 'gray' }}>
                      {new Date(ann.startTime).toLocaleString()} - {new Date(ann.endTime).toLocaleTimeString()}
                    </p>
                    <IonBadge color={ann.status === 'restored' ? 'success' : 'warning'}>{ann.status.toUpperCase()}</IonBadge>
                  </IonCardContent>
                </IonCard>
              ))
            )
          )}
        </div>

        {/* EXPORT MENU */}
        <IonActionSheet
          isOpen={showExportMenu}
          onDidDismiss={() => setShowExportMenu(false)}
          buttons={[
            { text: 'Export Reports Only', icon: documentTextOutline, handler: () => downloadPDF('reports') },
            { text: 'Export Announcements Only', icon: megaphoneOutline, handler: () => downloadPDF('announcements') },
            { text: 'Export Both', icon: layersOutline, handler: () => downloadPDF('both') },
            { text: 'Cancel', role: 'cancel' }
          ]}
        />

        {/* REJECT REASON ALERT */}
        <IonAlert
          isOpen={showRejectAlert}
          onDidDismiss={() => setShowRejectAlert(false)}
          header="Reject Report"
          message="Pumili ng dahilan kung bakit ire-reject ang report."
          inputs={[
            { name: 'reason', type: 'radio', label: 'Fake report', value: 'Fake report' },
            { name: 'reason', type: 'radio', label: 'Duplicate report', value: 'Duplicate report' },
            { name: 'reason', type: 'radio', label: 'Not in our area', value: 'Not in our area' },
            { name: 'reason', type: 'radio', label: 'Other', value: 'Other' },
          ]}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Reject', handler: (data) => handleConfirmReject(data.reason) }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ManageReports;