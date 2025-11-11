import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useMainContext } from "../../contexts/MainContext";
import api from "../../api";


export default function RegisterScreen({ navigation }) {
  const { isLoggedIn, login } = useMainContext();

  const [formData, setFormData] = useState({
    role: 'Community Member', // Default value helps with Pickers
    skills: '',
    profilePic: null,
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthdate: new Date(), // Use actual Date object for RN DateTimePicker
    employed: '',
    certificates: [],
    validId: null,
  });

  const [showPopup, setShowPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- Validation Logic (Same as Web) ---
  const validateForm = () => {
    const errors = {};
    if (!formData.username || formData.username.length < 3) errors.username = "Username must be at least 3 characters long";
    if (!formData.password || formData.password.length < 8) errors.password = "Password must be at least 8 characters long";
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) errors.email = "Please enter a valid email address";
    
    const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) errors.phone = "Please enter a valid phone number";

    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    // Birthdate is usually pre-filled with 'new Date()', check if user actually changed it if strictly required, or just accept default.
    if (!formData.employed) errors.employed = "Employment status is required";

    if (formData.role === "Service Provider Applicant") {
      if (!formData.skills || formData.skills.trim() === "") errors.skills = "Skills are required for Service Providers";
      if (formData.certificates.length === 0) errors.certificates = "Certificates are required for Service Providers";
      if (!formData.validId) errors.validId = "Valid ID is required for Service Providers";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (!hasSubmitted) return;
    const timer = setTimeout(() => validateForm(), 500);
    return () => clearTimeout(timer);
  }, [formData, hasSubmitted]);

  // --- Handlers ---
  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    if (selectedDate) {
      setFormData({ ...formData, birthdate: selectedDate });
    }
  };

  // --- Image Pickers ---
  const pickImage = async (field, isMultiple = false) => {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: !isMultiple, // Editing usually only for single photos like profile pic
      aspect: field === 'profilePic' ? [1, 1] : [4, 3],
      quality: 0.8,
      allowsMultipleSelection: isMultiple, // For certificates
    });

    if (!result.canceled) {
        if (isMultiple) {
             // Append new selections to existing certificates
             setFormData({ ...formData, [field]: [...formData.certificates, ...result.assets] });
        } else {
             setFormData({ ...formData, [field]: result.assets[0] });
        }
    }
  };

  // --- Password Strength ---
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: "", color: '#e0e0e0' };
    if (password.length < 6) return { strength: 1, label: "Weak", color: '#ff4d4d' };
    if (password.length < 10) return { strength: 2, label: "Medium", color: '#ffd700' };
    return { strength: 3, label: "Strong", color: '#00cc66' };
  };
  const passwordStrength = getPasswordStrength(formData.password);

  // --- Submit Handler ---
  const handleRegister = async () => {
    setHasSubmitted(true);

    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors in the form before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      
      // Helper to append RN images to FormData
      const appendImage = (key, imageAsset) => {
          if (!imageAsset) return;
          // RN needs uri, name, and type for FormData files
          const uriParts = imageAsset.uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          submitData.append(key, {
              uri: imageAsset.uri,
              name: imageAsset.fileName || `photo.${fileType}`,
              type: `image/${fileType}` // e.g., image/jpeg
          });
      };

      Object.keys(formData).forEach((key) => {
         if (key === 'profilePic') {
             appendImage('profilePic', formData.profilePic);
         } else if (key === 'validId') {
             if (formData.role === "Service Provider Applicant") {
                 appendImage('validId', formData.validId);
             }
         } else if (key === 'certificates') {
             formData.certificates.forEach((cert, index) => {
                  // For multiple files, you might need to append with same name 'certificates'
                  // or 'certificates[]' depending on your backend.
                  const uriParts = cert.uri.split('.');
                  const fileType = uriParts[uriParts.length - 1];
                  submitData.append('certificates', {
                    uri: cert.uri,
                    name: cert.fileName || `cert_${index}.${fileType}`,
                    type: `image/${fileType}`
                });
             });
         } else if (key === 'birthdate') {
             submitData.append(key, formData.birthdate.toISOString().split('T')[0]);
         } else if (key === 'employed') {
             // Map employed values to backend expected format
             let employedValue = formData.employed;
             if (employedValue === 'student' || employedValue === 'self-employed') {
                 employedValue = 'employed';
             }
             submitData.append(key, employedValue);
         } else {
             submitData.append(key, formData[key]);
         }
      });

      // --- API CALL ---
      const { data } = await api.post("/user/register", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      Alert.alert("Success", data.message);
      setShowPopup(true);

      // Update Context & Storage using login function
      await login(data.user, data.token);

      setTimeout(() => {
          setShowPopup(false);
          // navigation.replace('Home'); // Navigate to home after success
      }, 3000);

    } catch (error) {
      Alert.alert("Registration Failed", error.response?.data?.message || error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already logged in, redirect (standard RN way would be handled by navigation stack, but kept here for parity)
  useEffect(() => {
      if (isLoggedIn) {
          // navigation.navigate('Home');
      }
  }, [isLoggedIn]);

  return (
    <KeyboardAwareScrollView 
        style={{ flex: 1, backgroundColor: '#f5f7fa' }}
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
  
        {/* --- FORM START --- */}

        {/* Profile Picture */}
        <View style={styles.formGroup}>
            <Text style={styles.label}>Upload Profile Picture (Optional)</Text>
            <TouchableOpacity style={styles.imageUploadBtn} onPress={() => pickImage('profilePic')}>
                {formData.profilePic ? (
                    <Image source={{ uri: formData.profilePic.uri }} style={styles.profilePreview} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <FontAwesome5 name="camera" size={20} color="#ccc" />
                        <Text style={styles.placeholderText}>Tap to select</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>

        {/* Username */}
        <Input
          icon="user"
          placeholder="Choose a unique username"
          value={formData.username}
          onChangeText={(val) => handleChange('username', val)}
          error={validationErrors.username}
          showSuccess={formData.username && !validationErrors.username}
        />
        <Text style={styles.helpText}>Visible to other users (min 3 chars)</Text>

         {/* Password */}
         <Input
          icon="lock"
          placeholder="Enter Password"
          value={formData.password}
          onChangeText={(val) => handleChange('password', val)}
          secureTextEntry={!showPassword}
          error={validationErrors.password}
          showSuccess={formData.password && passwordStrength.strength >= 2}
          onTogglePassword={() => setShowPassword(!showPassword)}
          isPassword={true}
          showPassword={showPassword}
        />
        {/* Strength Bar */}
        {formData.password.length > 0 && (
             <View style={styles.strengthContainer}>
                <View style={[styles.strengthBar, { 
                    width: `${(passwordStrength.strength + 1) * 25}%`, 
                    backgroundColor: passwordStrength.color 
                }]} />
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                </Text>
             </View>
        )}
        <Text style={styles.helpText}>At least 8 characters long</Text>

        {/* Confirm Password */}
        <Input
          icon="lock"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(val) => handleChange('confirmPassword', val)}
          secureTextEntry={!showConfirmPassword}
          error={validationErrors.confirmPassword}
          showSuccess={formData.confirmPassword && formData.password === formData.confirmPassword && !validationErrors.confirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          isPassword={true}
          showPassword={showConfirmPassword}
        />

        {/* Email */}
        <Input
          icon="envelope"
          placeholder="Enter Email"
          value={formData.email}
          onChangeText={(val) => handleChange('email', val)}
          keyboardType="email-address"
          error={validationErrors.email}
          showSuccess={formData.email && !validationErrors.email}
        />

        {/* First Name & Last Name */}
        <Input
          icon="id-card"
          placeholder="First Name"
          value={formData.firstName}
          onChangeText={(val) => handleChange('firstName', val)}
          error={validationErrors.firstName}
          showSuccess={formData.firstName && !validationErrors.firstName}
        />
        <Input
          icon="id-card"
          placeholder="Last Name"
          value={formData.lastName}
          onChangeText={(val) => handleChange('lastName', val)}
          error={validationErrors.lastName}
          showSuccess={formData.lastName && !validationErrors.lastName}
        />

        {/* Phone */}
        <Input
          icon="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChangeText={(val) => handleChange('phone', val)}
          keyboardType="phone-pad"
          error={validationErrors.phone}
          showSuccess={formData.phone && !validationErrors.phone}
        />

        {/* Address */}
        <Input
          icon="map-marker-alt"
          placeholder="Address"
          value={formData.address}
          onChangeText={(val) => handleChange('address', val)}
          error={validationErrors.address}
          showSuccess={formData.address && !validationErrors.address}
        />

        {/* Role Picker */}
        <View style={styles.pickerContainer}>
             <FontAwesome5 name="user-tag" size={18} color="#db3295ff" style={styles.inputIcon} />
             <Picker
                selectedValue={formData.role}
                style={styles.picker}
                onValueChange={(itemValue) => handleChange('role', itemValue)}
             >
                <Picker.Item label="Community Member" value="Community Member" />
                <Picker.Item label="Service Provider" value="Service Provider Applicant" />
             </Picker>
        </View>
        <Text style={styles.helpText}>Members request services, Providers offer them.</Text>

        {/* --- CONDITIONAL SERVICE PROVIDER FIELDS --- */}
        {formData.role === "Service Provider Applicant" && (
            <>
                 <Input
                    icon="tools"
                    placeholder="Enter skills (comma-separated)"
                    value={formData.skills}
                    onChangeText={(val) => handleChange('skills', val)}
                    error={validationErrors.skills}
                    showSuccess={formData.skills && !validationErrors.skills}
                />
                <Text style={styles.helpText}>Ex: Plumbing, Electrical, Cleaning</Text>
            </>
        )}

        {/* Birthdate */}
        <TouchableOpacity style={[styles.inputContainer, validationErrors.birthdate && styles.inputError]} onPress={() => setShowDatePicker(true)}>
             <FontAwesome5 name="calendar" size={18} color="#db3295ff" style={styles.inputIcon} />
             <Text style={styles.dateText}>{formData.birthdate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {validationErrors.birthdate && <Text style={styles.errorText}>{validationErrors.birthdate}</Text>}

        {showDatePicker && (
            <DateTimePicker
                testID="dateTimePicker"
                value={formData.birthdate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={handleDateChange}
            />
        )}

        {/* Employment Status Picker */}
        <View style={[styles.pickerContainer, validationErrors.employed && styles.inputError]}>
             <FontAwesome5 name="briefcase" size={18} color="#db3295ff" style={styles.inputIcon} />
             <Picker
                selectedValue={formData.employed}
                style={styles.picker}
                onValueChange={(itemValue) => handleChange('employed', itemValue)}
             >
                <Picker.Item label="Select Employment Status" value="" color="#999"/>
                <Picker.Item label="Employed" value="employed" />
                <Picker.Item label="Unemployed" value="unemployed" />
                <Picker.Item label="Student" value="student" />
                <Picker.Item label="Self-Employed" value="self-employed" />
             </Picker>
        </View>
        {validationErrors.employed && <Text style={styles.errorText}>{validationErrors.employed}</Text>}

        {/* --- MORE PROVIDER DOCUMENTS --- */}
        {formData.role === "Service Provider Applicant" && (
            <>
                {/* Certificates (Multi) */}
                 <View style={styles.formGroup}>
                    <Text style={styles.label}>Upload Certificates *</Text>
                    <TouchableOpacity style={[styles.fileUploadBtn, validationErrors.certificates && styles.inputError]} onPress={() => pickImage('certificates', true)}>
                        <FontAwesome5 name="file-upload" size={20} color="#666" />
                        <Text style={styles.fileUploadText}>Select Files</Text>
                    </TouchableOpacity>
                    
                    {/* Preview list for certificates */}
                    <View style={styles.previewList}>
                        {formData.certificates.map((cert, index) => (
                             <Image key={index} source={{ uri: cert.uri }} style={styles.certPreview} />
                        ))}
                    </View>
                    {validationErrors.certificates && <Text style={styles.errorText}>{validationErrors.certificates}</Text>}
                </View>

                {/* Valid ID (Single) */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Upload Valid ID *</Text>
                    <TouchableOpacity style={[styles.fileUploadBtn, validationErrors.validId && styles.inputError]} onPress={() => pickImage('validId', false)}>
                        <FontAwesome5 name="id-badge" size={20} color="#666" />
                        <Text style={styles.fileUploadText}>
                             {formData.validId ? "Change ID Photo" : "Select ID Photo"}
                        </Text>
                    </TouchableOpacity>
                    {formData.validId && (
                         <Image source={{ uri: formData.validId.uri }} style={styles.idPreview} resizeMode="cover" />
                    )}
                     {validationErrors.validId && <Text style={styles.errorText}>{validationErrors.validId}</Text>}
                </View>
            </>
        )}

        {/* Submit Button */}
        <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
            onPress={handleRegister}
            disabled={isSubmitting}
        >
            {isSubmitting ? (
                 <ActivityIndicator color="#fff" />
            ) : (
                 <Text style={styles.submitBtnText}>Create Account</Text>
            )}
        </TouchableOpacity>
        <Text style={styles.termsText}>By creating an account, you agree to our terms of service</Text>

        {/* Auth Links */}
        <View style={styles.authLinks}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                 <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
        </View>

      </View>

      {/* Success Popup Modal */}
      <Modal transparent={true} visible={showPopup} animationType="fade">
        <View style={styles.modalOverlay}>
             <View style={styles.modalBox}>
                 <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
                 <Text style={styles.modalText}>
                     Your registration information will be verified by our officials.
                 </Text>
             </View>
        </View>
      </Modal>

    </KeyboardAwareScrollView>
  );
}

// --- REUSABLE INPUT COMPONENT ---
const Input = ({ icon, error, showSuccess, isPassword, showPassword, onTogglePassword, ...props }) => (
  <View style={{ marginBottom: 15 }}>
      <View style={[styles.inputContainer, error && styles.inputError, showSuccess && styles.inputSuccess]}>
        {icon && <FontAwesome5 name={icon} size={18} color="#d61475ff" style={styles.inputIcon} />}
        <TextInput
          style={styles.input}
          placeholderTextColor="#999"
          {...props}
        />
        {isPassword && (
            <TouchableOpacity onPress={onTogglePassword} style={styles.passwordToggle}>
                 <FontAwesome5 name={showPassword ? "eye-slash" : "eye"} size={18} color="#666" />
            </TouchableOpacity>
        )}
        {showSuccess && !isPassword && <FontAwesome5 name="check" size={16} color="#4CAF50" style={{ marginRight: 10 }} />}
        {error && !isPassword && <FontAwesome5 name="times" size={16} color="#F44336" style={{ marginRight: 10 }} />}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);


// --- STYLES (Attempting to match standard auth-card CSS) ---
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    paddingBottom: 50,
  },
  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    height: 50,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  inputIcon: {
    marginLeft: 15,
  },
  passwordToggle: {
    padding: 10,
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#fff5f5',
  },
  inputSuccess: {
    borderColor: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 5,
  },
  helpText: {
    color: '#888',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 5,
  },
  // Strength Bar
  strengthContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: -10,
      marginBottom: 15,
      marginLeft: 5
  },
  strengthBar: {
      height: 4,
      borderRadius: 2,
      marginRight: 10,
  },
  strengthLabel: {
      fontSize: 12,
      fontWeight: '600',
  },
  // Pickers & Dates
  pickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 10,
      height: 50,
      marginBottom: 10, // adjusted for help text below it
      overflow: 'hidden',
  },
  picker: {
      flex: 1,
      height: 50,
  },
  dateText: {
      flex: 1,
      paddingHorizontal: 10,
      fontSize: 16,
      color: '#333',
  },
  // File Uploads
  formGroup: {
      marginBottom: 20,
  },
  label: {
      fontWeight: '600',
      color: '#555',
      marginBottom: 10,
      textAlign: "center"
  },
  imageUploadBtn: {
      width: 100,
      height: 100,
      borderRadius: 60,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#ddd',
  },
  profilePreview: {
      width: '100%',
      height: '100%',
  },
  placeholderImage: {
      alignItems: 'center',
  },
  placeholderText: {
      color: '#999',
      fontSize: 10,
      marginTop: 5,
  },
  fileUploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: '#f9f9f9',
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 10,
      borderStyle: 'dashed',
  },
  fileUploadText: {
      marginLeft: 10,
      color: '#666',
  },
  previewList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
  },
  certPreview: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 8,
      marginBottom: 8,
  },
  idPreview: {
      width: '100%',
      height: 150,
      borderRadius: 10,
      marginTop: 10,
  },
  sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#444',
      marginTop: 10,
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom: 5,
  },
  // Buttons & Links
  submitBtn: {
      backgroundColor: '#db3295ff', // Example primary color
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20,
  },
  submitBtnDisabled: {
      backgroundColor: '#a09dec',
  },
  submitBtnText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
  },
  termsText: {
      textAlign: 'center',
      color: '#999',
      fontSize: 12,
      marginTop: 15,
  },
  authLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: '#eee',
  },
  linkText: {
      color: '#666',
  },
  link: {
      color: '#db3295ff',
      fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  modalBox: {
      width: '80%',
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 30,
      alignItems: 'center',
      elevation: 10,
  },
  modalText: {
      fontSize: 18,
      textAlign: 'center',
      marginTop: 20,
      color: '#333',
      lineHeight: 24,
  },
});
