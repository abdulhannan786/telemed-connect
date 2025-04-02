const API_URL = 'http://127.0.0.1:8080';

// State management
let currentPatient = null;
let currentMessage = null;

// Load patient queue
async function loadPatientQueue() {
    try {
        const response = await fetch(`${API_URL}/patients/`);
        if (!response.ok) throw new Error('Failed to fetch patients');
        
        const patients = await response.json();
        const queueElement = document.getElementById('patientQueue');
        
        if (patients.length === 0) {
            queueElement.innerHTML = '<div class="text-center p-3">No patients in queue</div>';
            return;
        }
        
        queueElement.innerHTML = patients.map(patient => `
            <div class="patient-item ${patient.priority.toLowerCase()}-priority" 
                 data-patient-id="${patient.id}"
                 onclick="selectPatient(${patient.id})">
                <h6 class="mb-0">${patient.name}</h6>
                <small class="text-muted">${patient.priority} Priority</small>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading patient queue:', error);
        showError('Failed to load patient queue');
    }
}

// Load patient history
async function loadPatientHistory(patientId) {
    try {
        // Load patient data
        const patientResponse = await fetch(`${API_URL}/patients/${patientId}`);
        if (!patientResponse.ok) throw new Error('Failed to fetch patient data');
        const patient = await patientResponse.json();
        
        // Load prescriptions
        const prescriptionsResponse = await fetch(`${API_URL}/prescriptions/${patientId}`);
        const prescriptions = await prescriptionsResponse.json();
        
        // Load lab tests
        const labTestsResponse = await fetch(`${API_URL}/lab-tests/${patientId}`);
        const labTests = await labTestsResponse.json();
        
        // Update EHR sections
        document.getElementById('medicalHistory').innerHTML = 
            `<p>${patient.medical_history || 'No medical history recorded'}</p>`;
        
        document.getElementById('allergies').innerHTML = 
            `<p>${patient.allergies || 'No allergies recorded'}</p>`;
        
        // Update medications section with prescriptions
        const medicationsHtml = prescriptions.length > 0 
            ? prescriptions.map(p => `
                <div class="mb-2">
                    <strong>${p.medication_name}</strong><br>
                    <small>${p.dosage} - ${p.frequency} for ${p.duration}</small>
                    ${p.instructions ? `<br><small>Instructions: ${p.instructions}</small>` : ''}
                </div>
            `).join('')
            : '<p class="text-muted">No medications recorded</p>';
        document.getElementById('medications').innerHTML = medicationsHtml;
        
        // Update lab results section
        const labResultsHtml = labTests.length > 0
            ? labTests.map(test => `
                <div class="mb-2">
                    <strong>${test.test_type}</strong><br>
                    <small>Priority: ${test.priority}</small><br>
                    <small>Status: ${test.status}</small><br>
                    <small>Description: ${test.description}</small>
                </div>
            `).join('')
            : '<p class="text-muted">No lab results available</p>';
        document.getElementById('labResults').innerHTML = labResultsHtml;
        
    } catch (error) {
        console.error('Error loading patient history:', error);
        showError('Failed to load patient history');
    }
}

// Update selectPatient function
async function selectPatient(patientId) {
    try {
        console.log('Selecting patient:', patientId);
        const response = await fetch(`${API_URL}/patients/${patientId}`);
        if (!response.ok) throw new Error('Failed to fetch patient');
        
        const patient = await response.json();
        console.log('Selected patient:', patient);
        
        currentPatient = patient;
        
        // Update main patient info display
        const mainPatientInfo = document.getElementById('mainPatientInfo');
        if (mainPatientInfo) {
            mainPatientInfo.innerHTML = `
                <div class="alert alert-info">
                    <h5>${patient.name}</h5>
                    <p>ID: ${patient.patient_id} | Age: ${patient.age} | Gender: ${patient.gender}</p>
                    <p>Priority: ${patient.priority}</p>
                    <p>Vitals: BP ${patient.blood_pressure || 'N/A'} | HR ${patient.heart_rate || 'N/A'} | Temp ${patient.temperature || 'N/A'}</p>
                </div>
            `;
        }
        
        // Update consultation form patient info
        const formPatientInfo = document.getElementById('formPatientInfo');
        if (formPatientInfo) {
            formPatientInfo.innerHTML = `
                <strong>${patient.name}</strong><br>
                Age: ${patient.age} | ${patient.gender} | ID: #${patient.patient_id}
            `;
        }
        
        // Show consultation form
        const consultationForm = document.getElementById('consultationForm');
        if (consultationForm) {
            consultationForm.style.display = 'block';
            consultationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Show messaging section
        const messagingSection = document.getElementById('messagingSection');
        if (messagingSection) {
            messagingSection.style.display = 'block';
        }
        
        // Load patient history and messages
        await Promise.all([
            loadPatientHistory(patientId),
            loadMessages(patientId)
        ]);
        
        // Remove highlight from all patients
        document.querySelectorAll('.patient-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Highlight selected patient
        const selectedPatient = document.querySelector(`.patient-item[data-patient-id="${patientId}"]`);
        if (selectedPatient) {
            selectedPatient.classList.add('active');
        }
        
        // Start vital signs simulation
        startVitalSignsSimulation();
        
    } catch (error) {
        console.error('Error selecting patient:', error);
        showError('Failed to select patient');
    }
}

// Generate random vital signs (simulating IoT sensor data)
function generateRandomVitalSigns() {
    return {
        blood_pressure: `${Math.floor(Math.random() * (140 - 110) + 110)}/${Math.floor(Math.random() * (90 - 70) + 70)}`,
        heart_rate: Math.floor(Math.random() * (100 - 60) + 60),
        temperature: (Math.random() * (37.5 - 36.5) + 36.5).toFixed(1),
        oxygen_saturation: Math.floor(Math.random() * (100 - 95) + 95),
        respiratory_rate: Math.floor(Math.random() * (20 - 12) + 12)
    };
}

// Update vital signs display
function updateVitalSigns(vitalSigns) {
    if (!vitalSigns) return;
    
    // Update each vital sign with animation
    const updateElement = (id, value, unit = '') => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = `${value}${unit}`;
            element.classList.add('text-primary');
            setTimeout(() => element.classList.remove('text-primary'), 1000);
        }
    };
    
    // Update all vital signs
    updateElement('bloodPressure', vitalSigns.blood_pressure, ' mmHg');
    updateElement('heartRate', vitalSigns.heart_rate, ' BPM');
    updateElement('temperature', vitalSigns.temperature, '°C');
    updateElement('oxygenSaturation', vitalSigns.oxygen_saturation, '%');
    updateElement('respiratoryRate', vitalSigns.respiratory_rate, ' breaths/min');
}

// Simulate real-time vital signs updates
function startVitalSignsSimulation() {
    if (!currentPatient) return;
    
    // Clear any existing interval
    if (window.vitalSignsInterval) {
        clearInterval(window.vitalSignsInterval);
    }
    
    // Generate initial vital signs
    const initialVitalSigns = generateRandomVitalSigns();
    updateVitalSigns(initialVitalSigns);
    
    // Update vital signs every 5 seconds
    window.vitalSignsInterval = setInterval(() => {
        if (currentPatient) {
            const newVitalSigns = generateRandomVitalSigns();
            updateVitalSigns(newVitalSigns);
        }
    }, 5000);
}

// Stop vital signs simulation
function stopVitalSignsSimulation() {
    if (window.vitalSignsInterval) {
        clearInterval(window.vitalSignsInterval);
        window.vitalSignsInterval = null;
    }
}

// Highlight selected patient in queue
function highlightSelectedPatient(patientId) {
    const patientItems = document.querySelectorAll('.patient-item');
    patientItems.forEach(item => {
        const itemPatientId = parseInt(item.dataset.patientId);
        if (itemPatientId === patientId) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// Clear consultation form
function clearConsultationForm() {
    document.getElementById('symptoms').value = '';
    document.getElementById('diagnosis').value = '';
    document.getElementById('prescription').value = '';
    document.getElementById('notes').value = '';
}

// Start consultation
function startConsultation() {
    if (!currentPatient) {
        showError('Please select a patient first');
        return;
    }
    
    const patientName = currentPatient.name;
    showSuccess(`Starting consultation with ${patientName}`);
}

// Save consultation
async function saveConsultation(isDraft = true) {
    if (!currentPatient) {
        showError('Please select a patient first');
        return;
    }

    const symptoms = document.getElementById('symptoms').value;
    const diagnosis = document.getElementById('diagnosis').value;
    const prescription = document.getElementById('prescription').value;
    const notes = document.getElementById('notes').value;

    if (!symptoms.trim() && !isDraft) {
        showError('Please enter symptoms');
        return;
    }

    const consultation = {
        patient_id: currentPatient.id,
        symptoms: symptoms,
        diagnosis: diagnosis,
        prescription: prescription,
        notes: notes,
        status: isDraft ? 'draft' : 'completed'
    };

    try {
        // First, update patient status to completed
        if (!isDraft) {
            const statusResponse = await fetch(`${API_URL}/patients/${currentPatient.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'completed' })
            });

            if (!statusResponse.ok) {
                throw new Error('Failed to update patient status');
            }
        }

        // Then create the consultation
        const response = await fetch(`${API_URL}/consultations/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(consultation)
        });

        if (!response.ok) throw new Error('Failed to save consultation');

        const result = await response.json();
        showSuccess(`Consultation ${isDraft ? 'draft' : ''} saved successfully!`);
        
        if (!isDraft) {
            // Clear consultation form
            clearConsultationForm();
            
            // Remove patient from queue UI
            const patientItem = document.querySelector(`.patient-item[data-patient-id="${currentPatient.id}"]`);
            if (patientItem) {
                patientItem.remove();
            }
            
            // Reset current patient
            currentPatient = null;
            document.getElementById('patientInfo').innerHTML = 'Select a patient from the queue';
            
            // Refresh patient queue and recent consultations
            await loadPatientQueue();
            await loadRecentConsultations();
        }
    } catch (error) {
        console.error('Error saving consultation:', error);
        showError('Failed to save consultation');
    }
}

// Show error message with better UI
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Show success message with better UI
function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Add CSS for selected patient
const style = document.createElement('style');
style.textContent = `
    .patient-item.selected {
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
    }
    .patient-item {
        border-left: 4px solid transparent;
    }
`;
document.head.appendChild(style);

// Update dashboard statistics
async function updateDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/patients/`);
        if (!response.ok) throw new Error('Failed to fetch patients');
        
        const patients = await response.json();
        
        // Update statistics
        document.getElementById('totalPatients').textContent = patients.length;
        
        // Count high priority patients
        const highPriorityCount = patients.filter(p => p.priority === 'high').length;
        document.getElementById('highPriority').textContent = highPriorityCount;
        
        // Count active consultations (patients with ongoing consultations)
        const activeConsultations = patients.filter(p => p.status === 'active').length;
        document.getElementById('activeConsultations').textContent = activeConsultations;
        
        // Count today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = patients.filter(p => p.appointment_date === today).length;
        document.getElementById('todayAppointments').textContent = todayAppointments;
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Load recent consultations
async function loadRecentConsultations() {
    try {
        console.log('Loading recent consultations...');
        const response = await fetch(`${API_URL}/consultations/recent`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch recent consultations: ${response.status}`);
        }
        
        const consultations = await response.json();
        console.log('Received consultations:', consultations);
        
        const consultationsList = document.getElementById('recentConsultations');
        if (!consultationsList) {
            console.error('Recent consultations element not found');
            return;
        }
        
        if (consultations.length === 0) {
            consultationsList.innerHTML = '<div class="text-muted">No recent consultations</div>';
            return;
        }
        
        consultationsList.innerHTML = consultations.map(consultation => `
            <div class="consultation-item p-2 border-bottom">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${consultation.patient_name}</h6>
                        <small class="text-muted">ID: ${consultation.patient_id}</small>
                    </div>
                    <span class="badge ${consultation.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                        ${consultation.status}
                    </span>
                </div>
                <div class="mt-2">
                    <small class="text-muted">Symptoms: ${consultation.symptoms || 'Not specified'}</small><br>
                    <small class="text-muted">Diagnosis: ${consultation.diagnosis || 'Pending'}</small>
                </div>
                <small class="text-muted d-block mt-1">
                    ${new Date(consultation.created_at).toLocaleString()}
                </small>
            </div>
        `).join('');
        
        console.log('Recent consultations updated in DOM');
    } catch (error) {
        console.error('Error loading recent consultations:', error);
        const consultationsList = document.getElementById('recentConsultations');
        if (consultationsList) {
            consultationsList.innerHTML = `
                <div class="text-danger">
                    Error loading recent consultations: ${error.message}
                </div>
            `;
        }
    }
}

// Load notifications
async function loadNotifications() {
    try {
        const response = await fetch(`${API_URL}/notifications`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        
        const notifications = await response.json();
        const container = document.getElementById('notifications');
        
        if (notifications.length === 0) {
            container.innerHTML = '<div class="p-3 text-muted">No new notifications</div>';
            return;
        }
        
        container.innerHTML = notifications.map(notification => `
            <div class="notification-item" onclick="handleNotification(${notification.id})">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${notification.title}</h6>
                    <small class="text-muted">${new Date(notification.created_at).toLocaleTimeString()}</small>
                </div>
                <small class="text-muted">${notification.message}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading notifications:', error);
        document.getElementById('notifications').innerHTML = 
            '<div class="p-3 text-danger">Failed to load notifications</div>';
    }
}

// Quick action handlers
function scheduleFollowUp() {
    if (!currentPatient) {
        showError('Please select a patient first');
        return;
    }
    showSuccess(`Scheduling follow-up for ${currentPatient.name}`);
}

function requestLabWork() {
    if (!currentPatient) {
        showError('Please select a patient first');
        return;
    }
    showSuccess(`Requesting lab work for ${currentPatient.name}`);
}

function referToSpecialist() {
    if (!currentPatient) {
        showError('Please select a patient first');
        return;
    }
    showSuccess(`Referring ${currentPatient.name} to specialist`);
}

function prescribeMedication() {
    if (!currentPatient) {
        showError('Please select a patient first');
        return;
    }
    
    // Update patient info in prescription form
    document.getElementById('prescriptionPatientInfo').innerHTML = `
        <strong>${currentPatient.name}</strong><br>
        Age: ${currentPatient.age} | ${currentPatient.gender} | ID: #${currentPatient.patient_id}
    `;
    
    // Show prescription form
    document.getElementById('prescriptionForm').style.display = 'block';
    document.getElementById('prescriptionForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closePrescriptionForm() {
    document.getElementById('prescriptionForm').style.display = 'none';
}

async function submitPrescription() {
    if (!currentPatient) {
        showError('Please select a patient first');
        return;
    }
    
    const prescription = {
        patient_id: currentPatient.id,
        medication_name: document.getElementById('medicationName').value,
        dosage: document.getElementById('medicationDosage').value,
        frequency: document.getElementById('medicationFrequency').value,
        duration: document.getElementById('medicationDuration').value,
        instructions: document.getElementById('medicationInstructions').value
    };
    
    try {
        const response = await fetch(`${API_URL}/prescriptions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(prescription)
        });
        
        if (!response.ok) throw new Error('Failed to submit prescription');
        
        const result = await response.json();
        showSuccess('Prescription submitted successfully');
        closePrescriptionForm();
        
        // Clear form fields
        document.getElementById('medicationName').value = '';
        document.getElementById('medicationDosage').value = '';
        document.getElementById('medicationFrequency').value = '';
        document.getElementById('medicationDuration').value = '';
        document.getElementById('medicationInstructions').value = '';
        
        // Update patient's medications in EHR
        await loadPatientHistory(currentPatient.id);
        
    } catch (error) {
        console.error('Error submitting prescription:', error);
        showError('Failed to submit prescription');
    }
}

// Load consultation details
async function loadConsultation(consultationId) {
    try {
        const response = await fetch(`${API_URL}/consultations/${consultationId}`);
        if (!response.ok) throw new Error('Failed to fetch consultation');
        
        const consultation = await response.json();
        
        // Populate form with consultation data
        document.getElementById('symptoms').value = consultation.symptoms || '';
        document.getElementById('diagnosis').value = consultation.diagnosis || '';
        document.getElementById('prescription').value = consultation.prescription || '';
        document.getElementById('notes').value = consultation.notes || '';
        
        // Update patient info
        document.getElementById('patientInfo').innerHTML = `
            <strong>${consultation.patient_name}</strong><br>
            Age: ${consultation.patient_age} | ${consultation.patient_gender}
        `;
        
        showSuccess('Consultation loaded successfully');
    } catch (error) {
        console.error('Error loading consultation:', error);
        showError('Failed to load consultation');
    }
}

// Handle notification click
async function handleNotification(notificationId) {
    try {
        const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to mark notification as read');
        
        // Reload notifications
        loadNotifications();
    } catch (error) {
        console.error('Error handling notification:', error);
        showError('Failed to handle notification');
    }
}

// Update the loadDashboard function to include recent consultations
async function loadDashboard() {
    try {
        console.log('Loading dashboard data...');
        await Promise.all([
            loadPatientQueue(),
            loadRecentConsultations(),
            loadNotifications()
        ]);
        console.log('Dashboard data loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

// Call loadDashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing dashboard...');
    loadDashboard();
    
    // Set up periodic refresh
    setInterval(() => {
        console.log('Refreshing dashboard data...');
        loadDashboard();
    }, 30000); // Refresh every 30 seconds
});

// Add this at the end of the file, before the closing script tag
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing consultation form...');
    const consultationForm = document.getElementById('consultationForm');
    if (consultationForm) {
        console.log('Consultation form found, ensuring it is hidden initially');
        consultationForm.style.display = 'none';
    } else {
        console.error('Consultation form element not found in DOM');
    }
    
    // Load initial data
    loadDashboard();
});

// Lab test form functions
function requestLabWork() {
    if (!currentPatient) {
        showError('Please select a patient first');
        return;
    }
    
    // Update patient info in lab test form
    document.getElementById('labTestPatientInfo').innerHTML = `
        <strong>${currentPatient.name}</strong><br>
        Age: ${currentPatient.age} | ${currentPatient.gender} | ID: #${currentPatient.patient_id}
    `;
    
    // Show lab test form
    document.getElementById('labTestForm').style.display = 'block';
    document.getElementById('labTestForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeLabTestForm() {
    document.getElementById('labTestForm').style.display = 'none';
}

async function submitLabTest() {
    if (!currentPatient) {
        showError('Please select a patient first');
        return;
    }
    
    const labTest = {
        patient_id: currentPatient.id,
        test_type: document.getElementById('testType').value,
        description: document.getElementById('testDescription').value,
        priority: document.getElementById('testPriority').value
    };
    
    try {
        const response = await fetch(`${API_URL}/lab-tests/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(labTest)
        });
        
        if (!response.ok) throw new Error('Failed to submit lab test request');
        
        const result = await response.json();
        showSuccess('Lab test request submitted successfully');
        closeLabTestForm();
        
        // Clear form fields
        document.getElementById('testType').value = '';
        document.getElementById('testDescription').value = '';
        document.getElementById('testPriority').value = 'routine';
        
        // Update lab results in EHR
        await loadPatientHistory(currentPatient.id);
        
    } catch (error) {
        console.error('Error submitting lab test request:', error);
        showError('Failed to submit lab test request');
    }
}

// Messaging functions
function toggleMessaging() {
    const messageList = document.getElementById('messageList');
    const messageContent = document.getElementById('messageContent');
    const newMessageForm = document.getElementById('newMessageForm');
    
    if (messageList.style.display === 'none') {
        messageList.style.display = 'block';
        messageContent.style.display = 'none';
        newMessageForm.style.display = 'block';
        if (currentPatient) {
            loadMessages(currentPatient.id);
        }
    } else {
        messageList.style.display = 'none';
        messageContent.style.display = 'block';
        newMessageForm.style.display = 'block';
    }
}

async function loadMessages(patientId) {
    try {
        const response = await fetch(`${API_URL}/messages/${patientId}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        
        const messages = await response.json();
        const messageList = document.getElementById('messageList');
        
        if (messages.length === 0) {
            messageList.innerHTML = '<div class="text-center p-3">No messages</div>';
            return;
        }
        
        messageList.innerHTML = messages.map(message => `
            <div class="message-item ${!message.is_read ? 'unread' : ''}" 
                 onclick="showMessage(${message.id})">
                <div class="d-flex justify-content-between">
                    <strong>${message.sender_id === patientId ? 'You' : 'Doctor'}</strong>
                    <small class="text-muted">${new Date(message.created_at).toLocaleString()}</small>
                </div>
                <div class="text-truncate">${message.content}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading messages:', error);
        showError('Failed to load messages');
    }
}

async function showMessage(messageId) {
    try {
        const response = await fetch(`${API_URL}/messages/${currentPatient.id}`);
        if (!response.ok) throw new Error('Failed to fetch message');
        
        const messages = await response.json();
        const message = messages.find(m => m.id === messageId);
        if (!message) throw new Error('Message not found');
        
        currentMessage = message;
        
        // Update message content display
        document.getElementById('messageSubject').textContent = 
            `From: ${message.sender_id === currentPatient.id ? 'You' : 'Doctor'}`;
        document.getElementById('messageTime').textContent = 
            new Date(message.created_at).toLocaleString();
        document.getElementById('messageBody').textContent = message.content;
        
        // Show message content and hide message list
        document.getElementById('messageList').style.display = 'none';
        document.getElementById('messageContent').style.display = 'block';
        document.getElementById('newMessageForm').style.display = 'block';
        
        // Mark message as read if it's not already read
        if (!message.is_read) {
            await markMessageAsRead(messageId);
        }
        
    } catch (error) {
        console.error('Error showing message:', error);
        showError('Failed to load message');
    }
}

async function markMessageAsRead(messageId) {
    try {
        const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to mark message as read');
        
        // Update UI to reflect read status
        const messageItem = document.querySelector(`.message-item[onclick*="${messageId}"]`);
        if (messageItem) {
            messageItem.classList.remove('unread');
        }
        
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

async function sendMessage() {
    if (!currentPatient) {
        showError('Please select a patient first');
        return;
    }
    
    const messageText = document.getElementById('messageText').value.trim();
    if (!messageText) {
        showError('Please enter a message');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/messages/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sender_id: currentPatient.id,
                receiver_id: 1, // Assuming doctor's ID is 1
                content: messageText
            })
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        
        // Clear message input
        document.getElementById('messageText').value = '';
        
        // Reload messages
        await loadMessages(currentPatient.id);
        
        // Show success message
        showSuccess('Message sent successfully');
        
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message');
    }
} 