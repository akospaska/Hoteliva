import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSession } from '../lib/use-session';
import { Login } from '../screens/Login';
import { Workspace } from '../screens/Workspace';

export default function Index() {
  const session = useSession();
  const params = useLocalSearchParams<{ activation?: string; group?: string }>();
  if (session.loading)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <ActivityIndicator color="#246752" />
        <Text>{session.copy.loading}</Text>
      </View>
    );
  if (params.activation)
    return (
      <Login
        session={session}
        activation={params.activation}
        onActivated={() => router.replace('/')}
      />
    );
  return session.user ? (
    <Workspace key={params.group || session.user.id} session={session} />
  ) : (
    <Login session={session} onActivated={() => router.replace('/')} />
  );
}
