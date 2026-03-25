import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SafeScreen } from '@/components/layout/SafeScreen';

const SENT_MESSAGE =
  "Hi! I'd love to be considered for the marketing role. I'm a great fit.";

function Avatar({
  letter,
  bg,
}: {
  letter: string;
  bg: string;
}) {
  return (
    <View style={[styles.avatar, { backgroundColor: bg }]}>
      <Text style={styles.avatarLetter}>{letter}</Text>
    </View>
  );
}

function ChatColumn({
  letter,
  avatarBg,
  name,
  reply,
  replyStyle,
  replyTextColor,
}: {
  letter: string;
  avatarBg: string;
  name: string;
  reply: string;
  replyStyle: object;
  replyTextColor: string;
}) {
  return (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <Avatar letter={letter} bg={avatarBg} />
        <Text style={styles.columnName}>{name}</Text>
      </View>

      <View style={styles.sentBubble}>
        <Text style={styles.sentText}>{SENT_MESSAGE}</Text>
      </View>

      <View style={[styles.replyBubbleBase, replyStyle]}>
        <Text style={[styles.replyText, { color: replyTextColor }]}>{reply}</Text>
      </View>
    </View>
  );
}

export default function PainChatScreen() {
  const router = useRouter();

  return (
    <SafeScreen>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backChevron}>‹</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>THE DATA</Text>
      <Text style={styles.headline}>{'Same message.\nDifferent outcomes.'}</Text>

      <View style={styles.chatRow}>
        <ChatColumn
          letter="A"
          avatarBg={Colors.primary}
          name="Emma K."
          reply="Hi Emma! We'd love to chat. Can you come in Thursday? 🙌"
          replyStyle={styles.replyPositive}
          replyTextColor={Colors.textPrimary}
        />
        <ChatColumn
          letter="B"
          avatarBg={Colors.surfaceElevated}
          name="Emma R."
          reply="Thanks for reaching out. We'll keep your CV on file."
          replyStyle={styles.replyNeutral}
          replyTextColor={Colors.textSecondary}
        />
      </View>

      <Text style={styles.dividerText}>Same message. Same qualifications.</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{'"Just work on your personality..."'}</Text>
        <Text style={styles.infoBody}>
          But how are you supposed to build confidence when you're overlooked before you even open
          your mouth? Confidence is built from successful experiences, not wishful thinking.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.stickyBottom}>
        <PrimaryButton label="Next →" onPress={() => router.push('/(onboarding)/cinematic')} />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  backChevron: {
    fontSize: 32,
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 36,
    marginTop: 24,
    marginBottom: 24,
  },
  chatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  columnName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  sentBubble: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  sentText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  replyBubbleBase: {
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
  },
  replyPositive: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: Colors.primary,
  },
  replyNeutral: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  replyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  infoBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  stickyBottom: {
    paddingBottom: 24,
    paddingTop: 16,
  },
});
