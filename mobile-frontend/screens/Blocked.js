import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMainContext } from '../contexts/MainContext';

const WorkerRow = ({ item, onPress }) => (
  <TouchableOpacity onPress={() => onPress(item)} style={styles.tableRow}>
    <Text style={[styles.tableCell, styles.nameCell]}>
      {item.firstName} {item.lastName}
    </Text>
    <Text style={[styles.tableCell, styles.serviceCell]}>
      {item.skills && item.skills.length > 0 ? item.skills.join(', ') : 'No skills listed'}
    </Text>
    <View style={[styles.tableCell, styles.ratingCell]}>
      <Ionicons name="star" size={16} color="#FFD700" />
      <Text style={styles.ratingText}>N/A</Text>
    </View>
  </TouchableOpacity>
);

const Blocked = ({ navigation }) => {
  const { api } = useMainContext();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getBlockedUsers();
      if (response.data.success) {
        setBlockedUsers(response.data.blockedUsers);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (worker) => {
    navigation.navigate("BlockedWorker", { worker });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading blocked users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.nameCell]}>Name</Text>
        <Text style={[styles.headerCell, styles.serviceCell]}>Skills</Text>
        <Text style={[styles.headerCell, styles.ratingCell]}>Status</Text>
      </View>

      <FlatList
        data={blockedUsers}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <WorkerRow item={item} onPress={handlePress} />}
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#666', textAlign: 'center' }}>
              No blocked users found
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  nameCell: {
    flex: 2,
  },
  serviceCell: {
    flex: 2,
    textAlign: 'left',
  },
  ratingCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
});

export default Blocked;
