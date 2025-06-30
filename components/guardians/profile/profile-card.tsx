import {View, Text, Image, StyleSheet} from 'react-native';

type ProfileCardProps = {
  name: string;
  email: string;
  profileImage?: string | null;
};

export default function ProfileCard({
  name,
  email,
  profileImage,
}: ProfileCardProps) {
  return (
    <View style={styles.profile}>
      {profileImage ? (
        <Image source={{uri: profileImage}} style={styles.profileImage} />
      ) : (
        <View style={styles.profileImage} />
      )}
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileEmail}>{email}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F2F2F2',
  },
  profileInfo: {
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666666',
  },
});
