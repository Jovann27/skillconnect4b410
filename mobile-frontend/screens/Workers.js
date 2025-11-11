import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { serviceProvidersAPI } from '../api';

// Worker item component
const WorkerItem = ({ worker, onPress }) => (
  <TouchableOpacity style={styles.workerItem} onPress={onPress}>
    <Image
      source={
        worker.profilePic
          ? { uri: worker.profilePic }
          : require('../assets/default-profile.png')
      }
      style={styles.workerAvatar}
    />
    <View style={styles.workerInfo}>
      <Text style={styles.workerName}>
        {worker.firstName} {worker.lastName}
      </Text>
      <Text style={styles.workerService}>
        {worker.service || 'Service Provider'}
      </Text>
      <Text style={styles.workerSkills}>
        Skills: {worker.skills?.join(', ') || 'Not specified'}
      </Text>
      {worker.serviceRate && (
        <Text style={styles.workerRate}>
          Rate: ₱{worker.serviceRate}
        </Text>
      )}
    </View>
    <Feather name="chevron-right" size={24} color="#828282" />
  </TouchableOpacity>
);

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      setIsLoading(true);
      try {
        const response = await serviceProvidersAPI.getServiceProviders();
        setWorkers(response.data.workers || []);
      } catch (error) {
        console.error('Error fetching workers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  const handleWorkerPress = (worker) => {
    console.log('Worker pressed:', worker);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#c20884" />
          <Text style={styles.loaderText}>Loading workers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {workers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No workers found.</Text>
        </View>
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <WorkerItem
              worker={item}
              onPress={() => handleWorkerPress(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  workerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
  },
  workerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  workerService: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  workerSkills: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  workerRate: {
    fontSize: 14,
    color: '#c20884',
    fontWeight: '600',
    marginTop: 2,
  },
});

export default Workers;