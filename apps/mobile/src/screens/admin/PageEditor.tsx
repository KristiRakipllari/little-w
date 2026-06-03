import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useStoryStore } from "@/store/storyStore";
import { uploadFile } from "@/services/api";
import { COLORS, SUPPORTED_LOCALES, LOCALE_LABELS } from "@calm-stories/shared";
import type { StoryPage, SupportedLocale } from "@calm-stories/shared";
import type { RootStackParamList } from "@/navigation/Navigator";

type RouteType = RouteProp<RootStackParamList, "PageEditor">;

export default function PageEditor() {
  const route = useRoute<RouteType>();
  const storyId = route.params.storyId;

  const {
    currentStory,
    isLoading,
    fetchStory,
    addPage,
    updatePage,
    deletePage,
    reorderPages,
  } = useStoryStore();

  const [activeLocale, setActiveLocale] = useState<SupportedLocale>("sq");
  const [newTextSq, setNewTextSq] = useState("");
  const [newTextEn, setNewTextEn] = useState("");
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editTextSq, setEditTextSq] = useState("");
  const [editTextEn, setEditTextEn] = useState("");
  const [adding, setAdding] = useState(false);
  const [uploadingPageId, setUploadingPageId] = useState<string | null>(null);
  const [newPageImageUri, setNewPageImageUri] = useState<string | null>(null);

  useEffect(() => {
    fetchStory(storyId);
  }, [storyId]);

  const pages = currentStory?.pages || [];

  const pickImage = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";

    if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) {
      Alert.alert("Invalid format", "Only PNG, JPEG, and WebP images are allowed.");
      return null;
    }

    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert("File too large", "Maximum image size is 5MB.");
      return null;
    }

    return asset;
  };

  const handleUploadForPage = async (pageId: string) => {
    const asset = await pickImage();
    if (!asset) return;

    setUploadingPageId(pageId);
    try {
      const filename = asset.uri.split("/").pop() || `image_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || "image/jpeg";
      const url = await uploadFile(asset.uri, filename, mimeType, storyId, "page");
      await updatePage(storyId, pageId, { image_url: url });
    } catch (err) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUploadingPageId(null);
    }
  };

  const handlePickNewPageImage = async () => {
    const asset = await pickImage();
    if (asset) {
      setNewPageImageUri(asset.uri);
    }
  };

  const handleAddPage = async () => {
    if (!newTextSq.trim() && !newTextEn.trim()) return;
    setAdding(true);
    try {
      let imageUrl: string | undefined;

      if (newPageImageUri) {
        const filename = newPageImageUri.split("/").pop() || `image_${Date.now()}.jpg`;
        imageUrl = await uploadFile(newPageImageUri, filename, "image/jpeg", storyId, "page");
      }

      await addPage(storyId, {
        text_sq: newTextSq.trim(),
        text_en: newTextEn.trim(),
        image_url: imageUrl,
      });
      setNewTextSq("");
      setNewTextEn("");
      setNewPageImageUri(null);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to add page");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async (pageId: string) => {
    if (!editTextSq.trim() && !editTextEn.trim()) return;
    await updatePage(storyId, pageId, {
      text_sq: editTextSq.trim(),
      text_en: editTextEn.trim(),
    });
    setEditingPage(null);
    setEditTextSq("");
    setEditTextEn("");
  };

  const handleDelete = (page: StoryPage) => {
    Alert.alert("Delete Page", `Delete page ${page.page_number}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePage(storyId, page.id),
      },
    ]);
  };

  const movePage = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= pages.length) return;

    const newOrder = [...pages];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(newIndex, 0, moved);

    await reorderPages(
      storyId,
      newOrder.map((p) => p.id)
    );
  };

  const startEdit = (page: StoryPage) => {
    setEditingPage(page.id);
    setEditTextSq(page.text_sq);
    setEditTextEn(page.text_en);
  };

  const renderLocaleTabs = () => (
    <View style={styles.localeTabs}>
      {SUPPORTED_LOCALES.map((loc) => (
        <TouchableOpacity
          key={loc}
          style={[styles.localeTab, activeLocale === loc && styles.localeTabActive]}
          onPress={() => setActiveLocale(loc)}
        >
          <Text
            style={[
              styles.localeTabText,
              activeLocale === loc && styles.localeTabTextActive,
            ]}
          >
            {loc === "sq" ? "\uD83C\uDDE6\uD83C\uDDF1" : "\uD83C\uDDEC\uD83C\uDDE7"} {LOCALE_LABELS[loc]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPage = ({ item, index }: { item: StoryPage; index: number }) => {
    const isEditing = editingPage === item.id;
    const isUploading = uploadingPageId === item.id;
    const displayText = activeLocale === "sq" ? item.text_sq : item.text_en;

    return (
      <View style={styles.pageCard}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageNumber}>Page {item.page_number}</Text>
          <View style={styles.pageActions}>
            <TouchableOpacity
              style={[styles.arrowBtn, index === 0 && styles.arrowDisabled]}
              onPress={() => movePage(index, "up")}
              disabled={index === 0}
            >
              <Text style={styles.arrowText}>{"\u25B2"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.arrowBtn,
                index === pages.length - 1 && styles.arrowDisabled,
              ]}
              onPress={() => movePage(index, "down")}
              disabled={index === pages.length - 1}
            >
              <Text style={styles.arrowText}>{"\u25BC"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => (isEditing ? handleSaveEdit(item.id) : startEdit(item))}
            >
              <Text style={styles.iconText}>{isEditing ? "\u2713" : "\u270F\uFE0F"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.iconText}>{"\uD83D\uDDD1\uFE0F"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isEditing ? (
          <View>
            <Text style={styles.langLabel}>{"\uD83C\uDDE6\uD83C\uDDF1"} Shqip</Text>
            <TextInput
              style={styles.editInput}
              value={editTextSq}
              onChangeText={setEditTextSq}
              multiline
              placeholder="Teksti n\u00EB shqip..."
              placeholderTextColor={COLORS.admin.textLight}
              autoFocus
            />
            <Text style={[styles.langLabel, { marginTop: 10 }]}>{"\uD83C\uDDEC\uD83C\uDDE7"} English</Text>
            <TextInput
              style={styles.editInput}
              value={editTextEn}
              onChangeText={setEditTextEn}
              multiline
              placeholder="Text in English..."
              placeholderTextColor={COLORS.admin.textLight}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingPage(null)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveEditBtn}
                onPress={() => handleSaveEdit(item.id)}
              >
                <Text style={styles.saveEditText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.pageText}>
              {displayText || (
                <Text style={styles.missingText}>
                  No {LOCALE_LABELS[activeLocale]} text
                </Text>
              )}
            </Text>
            {activeLocale === "sq" && !item.text_en && (
              <Text style={styles.missingHint}>{"\uD83C\uDDEC\uD83C\uDDE7"} English text missing</Text>
            )}
            {activeLocale === "en" && !item.text_sq && (
              <Text style={styles.missingHint}>{"\uD83C\uDDE6\uD83C\uDDF1"} Albanian text missing</Text>
            )}
          </View>
        )}

        {/* Image section */}
        {item.image_url ? (
          <View style={styles.imageSection}>
            <Image source={{ uri: item.image_url }} style={styles.pageImage} />
            <TouchableOpacity
              style={styles.changeImageBtn}
              onPress={() => handleUploadForPage(item.id)}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={COLORS.admin.primary} size="small" />
              ) : (
                <Text style={styles.changeImageText}>Change image</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addImageBtn}
            onPress={() => handleUploadForPage(item.id)}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color={COLORS.admin.primary} size="small" />
            ) : (
              <Text style={styles.addImageText}>+ Add image</Text>
            )}
          </TouchableOpacity>
        )}

        {item.audio_path_sq && (
          <Text style={styles.mediaTag}>{"\uD83D\uDD0A"} Audio (SQ)</Text>
        )}
        {item.audio_path_en && (
          <Text style={styles.mediaTag}>{"\uD83D\uDD0A"} Audio (EN)</Text>
        )}
      </View>
    );
  };

  if (isLoading && !currentStory) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.admin.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{currentStory?.title || "Pages"}</Text>
      <Text style={styles.subtitle}>{pages.length} pages</Text>

      {renderLocaleTabs()}

      <FlatList
        data={pages}
        keyExtractor={(item) => item.id}
        renderItem={renderPage}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No pages yet. Add your first page below.
            </Text>
          </View>
        }
      />

      {/* Add page form */}
      <View style={styles.addSection}>
        <Text style={styles.langLabel}>{"\uD83C\uDDE6\uD83C\uDDF1"} Shqip</Text>
        <TextInput
          style={styles.addInput}
          value={newTextSq}
          onChangeText={setNewTextSq}
          placeholder="Shkruaj tekstin n\u00EB shqip..."
          placeholderTextColor={COLORS.admin.textLight}
          multiline
        />
        <Text style={styles.langLabel}>{"\uD83C\uDDEC\uD83C\uDDE7"} English</Text>
        <TextInput
          style={styles.addInput}
          value={newTextEn}
          onChangeText={setNewTextEn}
          placeholder="Write text in English..."
          placeholderTextColor={COLORS.admin.textLight}
          multiline
        />

        {/* New page image picker */}
        <TouchableOpacity style={styles.pickImageBtn} onPress={handlePickNewPageImage}>
          {newPageImageUri ? (
            <View style={styles.newImagePreview}>
              <Image source={{ uri: newPageImageUri }} style={styles.previewThumb} />
              <Text style={styles.pickImageText}>Change image</Text>
            </View>
          ) : (
            <Text style={styles.pickImageText}>+ Attach image</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addButton,
            (!newTextSq.trim() && !newTextEn.trim() || adding) && styles.addButtonDisabled,
          ]}
          onPress={handleAddPage}
          disabled={(!newTextSq.trim() && !newTextEn.trim()) || adding}
        >
          {adding ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.addButtonText}>+ Add Page</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.admin.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.admin.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.admin.text,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.admin.textLight,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  localeTabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.admin.border,
  },
  localeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: COLORS.admin.surface,
  },
  localeTabActive: {
    backgroundColor: COLORS.admin.primary,
  },
  localeTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.admin.textLight,
  },
  localeTabTextActive: {
    color: "#FFF",
  },
  list: {
    padding: 16,
    paddingBottom: 8,
  },
  pageCard: {
    backgroundColor: COLORS.admin.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.admin.border,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pageNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.admin.primary,
  },
  pageActions: {
    flexDirection: "row",
    gap: 6,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#EEF",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 12,
    color: COLORS.admin.primary,
  },
  iconBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 16,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.admin.textLight,
    marginBottom: 4,
  },
  pageText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.admin.text,
  },
  missingText: {
    fontStyle: "italic",
    color: COLORS.admin.textLight,
  },
  missingHint: {
    fontSize: 11,
    color: "#E67E22",
    marginTop: 4,
  },
  mediaTag: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.admin.textLight,
  },
  editInput: {
    borderWidth: 1,
    borderColor: COLORS.admin.primary,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: COLORS.admin.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  cancelText: {
    color: COLORS.admin.textLight,
    fontWeight: "500",
  },
  saveEditBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: COLORS.admin.primary,
  },
  saveEditText: {
    color: "#FFF",
    fontWeight: "600",
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.admin.textLight,
    textAlign: "center",
  },
  addSection: {
    padding: 16,
    backgroundColor: COLORS.admin.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.admin.border,
  },
  addInput: {
    borderWidth: 1,
    borderColor: COLORS.admin.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.admin.text,
    minHeight: 50,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: COLORS.admin.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  // Image styles
  imageSection: {
    marginTop: 8,
  },
  pageImage: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  changeImageBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.admin.border,
  },
  changeImageText: {
    fontSize: 12,
    color: COLORS.admin.primary,
    fontWeight: "600",
  },
  addImageBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.admin.border,
    alignItems: "center",
  },
  addImageText: {
    fontSize: 13,
    color: COLORS.admin.primary,
    fontWeight: "600",
  },
  pickImageBtn: {
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.admin.border,
    alignItems: "center",
  },
  pickImageText: {
    fontSize: 13,
    color: COLORS.admin.primary,
    fontWeight: "600",
  },
  newImagePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#F0F0F0",
  },
});
