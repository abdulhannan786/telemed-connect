import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAvYK5BOWEww4JQ1P29b3SVtqwBA-ldJIg",
    authDomain: "telemedicine-1dec4.firebaseapp.com",
    projectId: "telemedicine-1dec4",
    storageBucket: "telemedicine-1dec4.appspot.com",
    messagingSenderId: "380643813197",
    appId: "1:380643813197:web:ebd6fff54df09c68353904",
    measurementId: "G-V12PXK1J5Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Handle authentication state changes
onAuthStateChanged(auth, async (user) => {
    const authModal = document.getElementById('authModal');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const userInfo = document.getElementById('userInfo');
    
    if (user) {
        // User is signed in
        authModal.style.display = 'none';
        loadingIndicator.style.display = 'block';
        userInfo.style.display = 'block';
        
        // Update user info
        document.getElementById('userName').textContent = user.displayName || user.email;
        document.getElementById('userPhoto').src = user.photoURL || 'https://via.placeholder.com/50';
        
        try {
            // Get the user's ID token
            const idToken = await user.getIdToken();
            
            // Send the token to your backend to get the user's role
            const response = await fetch('http://localhost:8000/users/role', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const userRole = data.role;
                document.getElementById('userRole').textContent = userRole;
                
                // Update UI based on user role
                updateUIForUserRole(userRole);
            } else {
                console.error('Failed to get user role');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    } else {
        // User is signed out
        authModal.style.display = 'block';
        userInfo.style.display = 'none';
        updateUIForUserRole(null);
    }
});

// Sign in with email and password
async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Error signing in:', error);
        alert('Error signing in: ' + error.message);
    }
}

// Sign out
function signOut() {
    signOut(auth);
}

// Update UI based on user role
function updateUIForUserRole(role) {
    const doctorSection = document.getElementById('doctorSection');
    const patientSection = document.getElementById('patientSection');
    
    if (role === 'doctor') {
        doctorSection.style.display = 'block';
        patientSection.style.display = 'none';
    } else if (role === 'patient') {
        doctorSection.style.display = 'none';
        patientSection.style.display = 'block';
    } else {
        doctorSection.style.display = 'none';
        patientSection.style.display = 'none';
    }
}

// Make functions available globally
window.signIn = signIn;
window.signOut = signOut; 