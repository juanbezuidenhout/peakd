import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { Colors } from '@/constants/colors';
import { getIsPro, getItem, KEYS } from '@/lib/storage';
import { chatWithCoach, type ChatMessage } from '@/lib/openai';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Category {
  id: string;
  name: string;
  initial: string;
  gradientColors: readonly [string, string];
  prompt: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'overall',
    name: 'Improve my overall look',
    initial: 'OL',
    gradientColors: ['#7C3AED', '#EC4899'],
    prompt: 'I want to improve my overall look. What should I focus on first?',
  },
  {
    id: 'skin',
    name: 'Perfect my skin routine',
    initial: 'SR',
    gradientColors: ['#22C55E', '#14B8A6'],
    prompt: 'Help me build the perfect skincare routine for my skin type.',
  },
  {
    id: 'makeup',
    name: 'Find my makeup style',
    initial: 'MS',
    gradientColors: ['#EC4899', '#F43F5E'],
    prompt: 'Help me find the best makeup style for my face shape and features.',
  },
  {
    id: 'hair',
    name: 'Style my hair',
    initial: 'SH',
    gradientColors: ['#3B82F6', '#6366F1'],
    prompt: 'What hairstyles would look best on me based on my face shape?',
  },
  {
    id: 'femininity',
    name: 'Boost my femininity',
    initial: 'BF',
    gradientColors: ['#8B5CF6', '#A855F7'],
    prompt: 'How can I enhance my feminine features and overall energy?',
  },
];

const LOCKED_IDS_FREE = new Set(['makeup', 'hair', 'femininity']);

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your Peakd coach. I've analyzed your face and built your personal plan. What would you like to work on today?",
};

const FALLBACK_RESPONSES: Record<string, string> = {
  overall:
    "Based on your features, I'd start with a consistent skincare routine and defining your brows. Those two changes create the biggest visual impact. Want me to break down a step by step plan?",
  skin: "For your skin, I'd recommend double cleansing at night, a vitamin C serum in the morning, and SPF 50 daily. Consistency matters more than expensive products. Shall I personalize this further?",
  makeup:
    "Your face shape and features would look stunning with a soft, natural makeup look. Think cream blush, fluffy brows, and a lip tint that matches your natural lip color. Want specific product tips?",
  hair: "Based on your face shape, face framing layers would beautifully highlight your features. A middle part with soft waves is very flattering too. Want me to suggest specific styles?",
  femininity:
    "Enhancing femininity starts with soft, rounded shapes. Think curved brows, rosy cheeks, and glossy lips. Pair that with good posture and graceful movement. Want a detailed daily plan?",
  default:
    "I'd love to help with that! Based on your features, I recommend starting with the basics: skincare, brow shaping, and finding your signature style. What area excites you most?",
};

function CategoryCardAnimated({
  cat,
  index,
  locked,
  onPress,
}: {
  cat: Category;
  index: number;
  locked: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(250 + index * 80).duration(400)}
    >
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 100 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={[
          styles.categoryCard,
          locked && styles.categoryCardLocked,
          animStyle,
        ]}
      >
        <LinearGradient
          colors={cat.gradientColors as unknown as [string, string]}
          style={styles.categoryIconWrap}
        >
          <Text style={styles.categoryInitial}>{cat.initial}</Text>
        </LinearGradient>
        <Text
          style={[
            styles.categoryName,
            locked && styles.categoryNameLocked,
          ]}
        >
          {cat.name}
        </Text>
        {locked ? (
          <View style={styles.lockBadge}>
            <Text style={styles.lockText}>PRO</Text>
          </View>
        ) : (
          <Text style={styles.chevron}>{'>'}</Text>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function CoachScreen() {
  const router = useRouter();
  const [isPro, setIsPro] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const lastChatHistory = useRef<Message[]>([]);

  useEffect(() => {
    (async () => {
      const pro = await getIsPro();
      setIsPro(pro);
    })();
  }, []);

  const fetchAIResponse = async (
    chatHistory: Message[],
    categoryId?: string,
  ) => {
    setIsLoading(true);
    setChatError(false);
    lastChatHistory.current = chatHistory;
    try {
      const scanResult = await getItem<string>(KEYS.SCAN_RESULT);
      const apiMessages: ChatMessage[] = chatHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await chatWithCoach(
        apiMessages,
        scanResult ? JSON.stringify(scanResult) : null,
        '',
      );

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: response },
      ]);
    } catch {
      const fallbackKey = categoryId ?? 'default';
      const fallback =
        FALLBACK_RESPONSES[fallbackKey] ?? FALLBACK_RESPONSES.default;
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: fallback },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openChat = (initialPrompt?: string, categoryId?: string) => {
    setActiveCategoryId(categoryId ?? null);

    if (initialPrompt) {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: initialPrompt,
      };
      const initial = [WELCOME_MESSAGE, userMsg];
      setMessages(initial);
      setChatVisible(true);
      setInput('');
      fetchAIResponse(initial, categoryId);
    } else {
      setMessages([WELCOME_MESSAGE]);
      setChatVisible(true);
      setInput('');
    }
  };

  const sendMessage = () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    fetchAIResponse(updated, activeCategoryId ?? undefined);
  };

  return (
    <SafeScreen>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={styles.headerRow}
        >
          <Text style={styles.headerTitle}>Your Coach</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/extras')}
            hitSlop={12}
          >
            <View style={styles.gearButton}>
              <View style={styles.gearDot} />
            </View>
          </Pressable>
        </Animated.View>

        {/* Ask me anything hero card */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <Pressable onPress={() => openChat()} style={styles.heroCard}>
            <View style={styles.heroAccent}>
              <LinearGradient
                colors={[
                  Colors.primaryGradientStart,
                  Colors.primaryGradientEnd,
                ]}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <LinearGradient
              colors={[
                Colors.primaryGradientStart,
                Colors.primaryGradientEnd,
              ]}
              style={styles.heroIconWrap}
            >
              <View style={styles.chatBubbleIcon}>
                <View style={styles.chatBubbleTail} />
              </View>
            </LinearGradient>
            <Text style={styles.heroText}>Ask me anything</Text>
            <Text style={styles.chevron}>{'>'}</Text>
          </Pressable>
        </Animated.View>

        {/* Section title */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Text style={styles.sectionTitle}>Learn how to...</Text>
        </Animated.View>

        {/* Category cards */}
        <View style={styles.categoryList}>
          {CATEGORIES.map((cat, index) => {
            const locked = !isPro && LOCKED_IDS_FREE.has(cat.id);
            return (
              <CategoryCardAnimated
                key={cat.id}
                cat={cat}
                index={index}
                locked={locked}
                onPress={() =>
                  locked
                    ? router.push('/paywall')
                    : openChat(cat.prompt, cat.id)
                }
              />
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={chatStyles.container}>
          {/* Header */}
          <View style={chatStyles.header}>
            <View style={chatStyles.handleBar} />
            <View style={chatStyles.headerInner}>
              <Text style={chatStyles.headerTitle}>Peakd Coach</Text>
              <Pressable
                onPress={() => setChatVisible(false)}
                hitSlop={12}
                style={chatStyles.closeBtn}
              >
                <Text style={chatStyles.closeIcon}>X</Text>
              </Pressable>
            </View>
          </View>

          {/* Body */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={chatStyles.body}
            keyboardVerticalOffset={10}
          >
            <ScrollView
              ref={scrollRef}
              style={chatStyles.messageList}
              contentContainerStyle={chatStyles.messageListContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
              }
            >
              {messages.map((msg, idx) => (
                <Animated.View
                  key={msg.id}
                  entering={FadeIn.delay(idx === 0 ? 0 : 100).duration(300)}
                  style={[
                    chatStyles.bubble,
                    msg.role === 'assistant'
                      ? chatStyles.aiBubble
                      : chatStyles.userBubble,
                  ]}
                >
                  <Text
                    style={[
                      chatStyles.bubbleText,
                      msg.role === 'user' && chatStyles.userText,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </Animated.View>
              ))}

              {isLoading && (
                <View style={[chatStyles.bubble, chatStyles.aiBubble]}>
                  <View style={chatStyles.typingRow}>
                    <View style={chatStyles.typingDot} />
                    <View style={chatStyles.typingDot} />
                    <View style={chatStyles.typingDot} />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input bar */}
            <View style={chatStyles.inputBar}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask your coach..."
                placeholderTextColor={Colors.textMuted}
                style={chatStyles.textInput}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                multiline
              />
              <Pressable
                onPress={sendMessage}
                style={[
                  chatStyles.sendBtn,
                  (!input.trim() || isLoading) && chatStyles.sendBtnDisabled,
                ]}
                disabled={!input.trim() || isLoading}
              >
                <View style={chatStyles.sendArrow} />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  gearButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gearDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary,
  },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    overflow: 'hidden',
  },
  heroAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  chatBubbleIcon: {
    width: 20,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  chatBubbleTail: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    transform: [{ rotate: '45deg' }],
  },
  heroText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 14,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textSecondary,
    fontWeight: '400',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
  },

  categoryList: {
    gap: 10,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 72,
    paddingHorizontal: 12,
  },
  categoryCardLocked: {
    opacity: 0.4,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  categoryName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 14,
  },
  categoryNameLocked: {
    color: Colors.textSecondary,
  },
  lockBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lockText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
});

const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 14,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  body: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 20,
    gap: 12,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2A2A2A',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  userText: {
    color: '#FFFFFF',
  },
  typingRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: 18,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
    marginTop: -2,
  },
});
