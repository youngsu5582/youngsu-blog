"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2, X, MapPin } from "lucide-react";

interface Activity {
  title: { ko: string; en: string };
  date: string;
  images: string[];
  description: { ko: string; en: string };
  full_content: { ko: string; en: string };
  latitude: number;
  longitude: number;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const emptyActivity: Activity = {
    title: { ko: "", en: "" },
    date: new Date().toISOString().slice(0, 16).replace("T", " ") + ":00 +0900",
    images: [],
    description: { ko: "", en: "" },
    full_content: { ko: "", en: "" },
    latitude: 0,
    longitude: 0,
  };

  const [formData, setFormData] = useState<Activity>(emptyActivity);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const res = await fetch("/api/admin/activities");
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setFormData({ ...activities[index] });
  };

  const handleNew = () => {
    setEditIndex(-1);
    setFormData(emptyActivity);
  };

  const handleCancel = () => {
    setEditIndex(null);
    setFormData(emptyActivity);
    setResult(null);
  };

  const handleSave = async () => {
    if (!formData.title.ko.trim() || !formData.title.en.trim()) {
      setResult({ success: false, message: "제목(ko/en)을 모두 입력하세요" });
      return;
    }

    setSaving(true);
    setResult(null);

    try {
      const method = editIndex === -1 ? "POST" : "PUT";
      const body = editIndex === -1 ? { activity: formData } : { index: editIndex, activity: formData };

      const res = await fetch("/api/admin/activities", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: editIndex === -1 ? "활동이 추가되었습니다" : "활동이 수정되었습니다" });
        await loadActivities();
        setTimeout(() => {
          setEditIndex(null);
          setFormData(emptyActivity);
          setResult(null);
        }, 1500);
      } else {
        setResult({ success: false, message: data.error || "저장 실패" });
      }
    } catch (error) {
      setResult({ success: false, message: "저장 중 오류 발생" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm("이 활동을 삭제하시겠습니까?")) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/activities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: "활동이 삭제되었습니다" });
        await loadActivities();
        if (editIndex === index) {
          setEditIndex(null);
          setFormData(emptyActivity);
        }
        setTimeout(() => setResult(null), 2000);
      } else {
        setResult({ success: false, message: data.error || "삭제 실패" });
      }
    } catch (error) {
      setResult({ success: false, message: "삭제 중 오류 발생" });
    } finally {
      setSaving(false);
    }
  };

  const addImage = () => {
    setFormData({ ...formData, images: [...formData.images, ""] });
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">활동 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">활동 데이터 추가/수정/삭제</p>
        </div>
        <button
          onClick={handleNew}
          disabled={editIndex !== null}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
          새 활동 추가
        </button>
      </div>

      {result && (
        <div
          className={`rounded-lg p-3 text-sm ${
            result.success
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          }`}
        >
          {result.message}
        </div>
      )}

      {editIndex !== null && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">{editIndex === -1 ? "새 활동" : "활동 수정"}</h3>
            <button onClick={handleCancel} className="p-1 hover:bg-background/50 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">제목 (한국어) *</label>
              <input
                value={formData.title.ko}
                onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ko: e.target.value } })}
                placeholder="한국어 제목"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">제목 (영어) *</label>
              <input
                value={formData.title.en}
                onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                placeholder="English title"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">날짜</label>
            <input
              type="datetime-local"
              value={formData.date.slice(0, 16).replace(" ", "T")}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value.replace("T", " ") + ":00 +0900" })
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-[10px] text-muted-foreground/50">형식: {formData.date}</p>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">설명 (한국어)</label>
              <textarea
                value={formData.description.ko}
                onChange={(e) =>
                  setFormData({ ...formData, description: { ...formData.description, ko: e.target.value } })
                }
                rows={3}
                placeholder="간단한 설명"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">설명 (영어)</label>
              <textarea
                value={formData.description.en}
                onChange={(e) =>
                  setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })
                }
                rows={3}
                placeholder="Brief description"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          </div>

          {/* Full Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">상세 내용 (한국어, HTML)</label>
            <textarea
              value={formData.full_content.ko}
              onChange={(e) =>
                setFormData({ ...formData, full_content: { ...formData.full_content, ko: e.target.value } })
              }
              rows={5}
              placeholder="<p>상세 내용...</p>"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">위도 (Latitude)</label>
              <input
                type="number"
                step="0.00001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                placeholder="37.51974"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">경도 (Longitude)</label>
              <input
                type="number"
                step="0.00001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                placeholder="126.99561"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">이미지 URL</label>
              <button
                onClick={addImage}
                className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                + 추가
              </button>
            </div>
            {formData.images.map((img, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={img}
                  onChange={(e) => updateImage(idx, e.target.value)}
                  placeholder="/assets/img/activities/2025/06/..."
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="px-3 py-2 rounded-md border border-border text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              저장
            </button>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
            <MapPin className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">활동이 없습니다</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={index}
              className={`rounded-lg border p-4 transition-all ${
                editIndex === index
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{activity.title.ko}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.title.en}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{activity.date}</span>
                    <span>•</span>
                    <span>이미지 {activity.images.length}개</span>
                    <span>•</span>
                    <span>
                      {activity.latitude.toFixed(5)}, {activity.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(index)}
                    disabled={editIndex !== null}
                    className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    disabled={saving}
                    className="text-xs px-3 py-1.5 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
