import { useCallback, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listItems, type MobileSavedItem } from '@/lib/database';
import { syncPendingCaptures } from '@/lib/sync';

export default function HomeScreen() {
  const [items, setItems] = useState<MobileSavedItem[]>([]);
  useFocusEffect(useCallback(() => {
    void listItems().then(setItems);
    void syncPendingCaptures().catch(() => undefined);
  }, []));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>YOUR ARCHIVE</Text>
            <Text accessibilityRole="header" style={styles.title}>Things worth finding again</Text>
            <Text style={styles.subtitle}>Save what caught your attention. Find it again when it matters.</Text>
            <Link href="/handle-share" asChild><Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>Save a find</Text></Pressable></Link>
          </View>
        }
        ListEmptyComponent={<View style={styles.empty}><Text accessibilityRole="header" style={styles.emptyTitle}>Your archive is empty.</Text><Text style={styles.emptyText}>Share a link, text, or screenshot to Kept, or save one manually.</Text></View>}
        renderItem={({ item }) => (
          <View style={styles.card} accessible accessibilityLabel={`${item.title}, ${item.domain || 'image capture'}`}>
            <Text style={styles.cardEyebrow}>{item.category.toUpperCase()}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.domain || 'Image capture'} · {new Date(item.savedAt).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5F8' },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 44, gap: 14 },
  header: { padding: 22, gap: 10, backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 10 },
  eyebrow: { color: '#606BAC', fontSize: 11, fontWeight: '800', letterSpacing: 1.7 },
  title: { color: '#20232B', fontSize: 44, lineHeight: 45, fontFamily: 'serif' },
  subtitle: { color: '#666C78', fontSize: 16, lineHeight: 24 },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 20, backgroundColor: '#5661A8', borderRadius: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.72 },
  empty: { minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F7F4F1', borderRadius: 20 },
  emptyTitle: { color: '#20232B', fontFamily: 'serif', fontSize: 30, textAlign: 'center' },
  emptyText: { maxWidth: 280, marginTop: 8, color: '#666C78', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  card: { minHeight: 140, justifyContent: 'flex-end', padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E8EE', borderRadius: 20 },
  cardEyebrow: { color: '#606BAC', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  cardTitle: { marginTop: 6, color: '#20232B', fontFamily: 'serif', fontSize: 27, lineHeight: 31 },
  cardMeta: { marginTop: 8, color: '#666C78', fontSize: 12 },
});
