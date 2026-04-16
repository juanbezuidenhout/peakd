import { View, Pressable, Modal, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { Colors } from "@/constants/colors";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { height } = useWindowDimensions();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.sheet, { maxHeight: height * 0.85 }]}
        >
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
});
