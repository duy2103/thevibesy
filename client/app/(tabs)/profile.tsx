import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ListItem, Button, Avatar, Icon, Switch } from '@rneui/themed';
import { useRouter } from 'expo-router';

interface RecentLocation {
  id: string;
  name: string;
  date: string;
  status: 'removed' | 'active';
}

export default function ProfileScreen() {
  const router = useRouter();
  const [recentLocations] = useState<RecentLocation[]>([
    {
      id: '1',
      name: 'Sample Restaurant',
      date: '2024-05-20',
      status: 'removed',
    },
  ]);

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar
          size={100}
          rounded
          icon={{ name: 'user', type: 'font-awesome' }}
          containerStyle={styles.avatar}
        />
        <Text h4>John Doe</Text>
        <Text style={styles.email}>john.doe@example.com</Text>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <ListItem bottomDivider onPress={() => {}}>
          <Icon name="key" type="font-awesome" />
          <ListItem.Content>
            <ListItem.Title>Change Password</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
        <ListItem bottomDivider onPress={() => {}}>
          <Icon name="list" type="font-awesome" />
          <ListItem.Content>
            <ListItem.Title>Manage Lists</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
        <ListItem bottomDivider>
          <Icon name="bell" type="font-awesome" />
          <ListItem.Content>
            <ListItem.Title>Notifications</ListItem.Title>
          </ListItem.Content>
          <Switch value={true} onValueChange={() => {}} />
        </ListItem>
      </View>

      {/* Recently Removed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recently Removed</Text>
        {recentLocations.map((location) => (
          <ListItem key={location.id} bottomDivider>
            <Icon name="map-marker" type="font-awesome" color="#e74c3c" />
            <ListItem.Content>
              <ListItem.Title>{location.name}</ListItem.Title>
              <ListItem.Subtitle>Removed on {location.date}</ListItem.Subtitle>
            </ListItem.Content>
            <Button
              title="Restore"
              type="clear"
              titleStyle={styles.restoreButton}
              onPress={() => {
                // TODO: Implement restore functionality
              }}
            />
          </ListItem>
        ))}
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <Button
          title="Export Data"
          icon={{
            name: 'download',
            type: 'font-awesome',
            color: 'white',
          }}
          buttonStyle={styles.button}
          containerStyle={styles.buttonContainer}
        />
        <Button
          title="Clear All Data"
          icon={{
            name: 'trash',
            type: 'font-awesome',
            color: '#e74c3c',
          }}
          type="outline"
          buttonStyle={[styles.button, styles.dangerButton]}
          titleStyle={{ color: '#e74c3c' }}
          containerStyle={styles.buttonContainer}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  avatar: {
    backgroundColor: '#3498db',
    marginBottom: 10,
  },
  email: {
    color: '#7f8c8d',
    marginTop: 5,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 15,
    marginBottom: 10,
  },
  buttonContainer: {
    marginHorizontal: 15,
    marginVertical: 5,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
  },
  dangerButton: {
    borderColor: '#e74c3c',
  },
  restoreButton: {
    color: '#3498db',
  },
}); 