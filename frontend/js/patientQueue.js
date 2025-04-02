// Function to load and display the patient queue
async function loadPatientQueue() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('No user logged in');
            return;
        }

        const idToken = await user.getIdToken();
        const response = await fetch('http://localhost:8000/patients/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });

        if (response.ok) {
            const patients = await response.json();
            displayPatientQueue(patients);
        } else {
            console.error('Failed to fetch patients');
        }
    } catch (error) {
        console.error('Error loading patient queue:', error);
    }
}

// Function to display patients in the queue
function displayPatientQueue(patients) {
    const queueContainer = document.getElementById('patientQueue');
    if (!queueContainer) {
        console.error('Patient queue container not found');
        return;
    }

    // Clear existing content
    queueContainer.innerHTML = '';

    // Sort patients by priority
    const sortedPatients = patients.sort((a, b) => {
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Create patient items
    sortedPatients.forEach(patient => {
        const patientItem = document.createElement('div');
        patientItem.className = `patient-item ${patient.priority}-priority`;
        patientItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${patient.name}</h6>
                    <small class="text-muted">Age: ${patient.age} | Gender: ${patient.gender}</small>
                </div>
                <div>
                    <span class="badge bg-${getPriorityBadgeColor(patient.priority)}">
                        ${patient.priority}
                    </span>
                </div>
            </div>
            <div class="mt-2">
                <small class="text-muted">
                    Blood Pressure: ${patient.blood_pressure || '--/--'} | 
                    Heart Rate: ${patient.heart_rate || '--'} | 
                    Temperature: ${patient.temperature || '--'}°C
                </small>
            </div>
        `;

        // Add click event to select patient
        patientItem.addEventListener('click', () => selectPatient(patient));
        queueContainer.appendChild(patientItem);
    });
}

// Function to get badge color based on priority
function getPriorityBadgeColor(priority) {
    switch (priority) {
        case 'high':
            return 'danger';
        case 'medium':
            return 'warning';
        case 'low':
            return 'success';
        default:
            return 'secondary';
    }
}

// Function to handle patient selection
function selectPatient(patient) {
    // Remove selected class from all items
    document.querySelectorAll('.patient-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Add selected class to clicked item
    const selectedItem = event.currentTarget;
    selectedItem.classList.add('selected');

    // Update patient info display
    updatePatientInfo(patient);
}

// Function to update patient information display
function updatePatientInfo(patient) {
    const patientInfo = document.getElementById('mainPatientInfo');
    if (!patientInfo) return;

    patientInfo.innerHTML = `
        <div class="card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 class="card-title">${patient.name}</h4>
                        <p class="card-text">
                            <strong>Age:</strong> ${patient.age} | 
                            <strong>Gender:</strong> ${patient.gender}
                        </p>
                    </div>
                    <div>
                        <span class="badge bg-${getPriorityBadgeColor(patient.priority)} fs-6">
                            ${patient.priority} Priority
                        </span>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h6 class="card-title">Blood Pressure</h6>
                                <p class="card-text">${patient.blood_pressure || '--/--'} mmHg</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h6 class="card-title">Heart Rate</h6>
                                <p class="card-text">${patient.heart_rate || '--'} BPM</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h6 class="card-title">Temperature</h6>
                                <p class="card-text">${patient.temperature || '--'}°C</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Show consultation form
    const consultationForm = document.getElementById('consultationForm');
    if (consultationForm) {
        consultationForm.style.display = 'block';
    }
}

// Make functions available globally
window.loadPatientQueue = loadPatientQueue;
window.selectPatient = selectPatient; 