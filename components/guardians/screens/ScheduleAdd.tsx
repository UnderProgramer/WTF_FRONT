"use client"

import { useState, useCallback, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DateTimePicker from "@react-native-community/datetimepicker"
import { XMarkIcon, CalendarDaysIcon, PlusIcon, CheckIcon } from "react-native-heroicons/outline"

const API_BASE_URL = "https://capstone-be-oasis.onrender.com"

export interface Medicine {
  id: string
  title: string
  startDate: Date
  endDate: Date
  times: Date[]
}

interface AddScheduleModalProps {
  visible: boolean
  onClose: () => void
  guardianId: string
  takerIdx: number
  authToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => void
}

export default function AddScheduleModal({
  visible,
  onClose,
  takerIdx,
  authToken,
  refreshToken,
  onTokenUpdate,
  guardianId,
}: AddScheduleModalProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [title, settitle] = useState<string>("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [times, setTimes] = useState<Date[]>([])
  const [showPicker, setShowPicker] = useState<"start" | "end" | "time" | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // takerIdx 유효성 검사 및 디버깅
  useEffect(() => {
    console.log("AddScheduleModal props:", {
      takerIdx,
      guardianId,
      authToken: authToken ? "present" : "missing",
      refreshToken: refreshToken ? "present" : "missing",
    })

    if (visible && (!takerIdx || takerIdx === 0)) {
      Alert.alert("사용자 정보 오류", "takerIdx가 유효하지 않습니다. 사용자를 다시 선택해주세요.", [
        { text: "확인", onPress: onClose },
      ])
    }
  }, [visible, takerIdx, guardianId, authToken, refreshToken, onClose])

  useEffect(() => {
    if (visible) {
      setMedicines([])
      settitle("")
      setStartDate(new Date())
      setEndDate(new Date())
      setTimes([])
      setErrors({})
      setDebugInfo(null)
    }
  }, [visible, takerIdx])

  const validateForm = useCallback(() => {
    const e: Record<string, string> = {}
    if (!title.trim()) {
      e.title = "약 이름을 입력하세요"
    }
    if (startDate > endDate) {
      e.range = "종료일이 시작일보다 늦어야 합니다"
    }
    if (times.length === 0) {
      e.times = "알람 시간을 하나 이상 추가하세요"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }, [title, startDate, endDate, times])

  const handleAddMedicine = useCallback(() => {
    if (!validateForm()) {
      return
    }
    const newMed: Medicine = {
      id: Date.now().toString(),
      title: title.trim(),
      startDate,
      endDate,
      times,
    }
    setMedicines((prev) => [...prev, newMed])
    settitle("")
    setStartDate(new Date())
    setEndDate(new Date())
    setTimes([])
    setErrors({})
  }, [title, startDate, endDate, times, validateForm])

  const handleDateChange = useCallback(
    (_: any, date?: Date) => {
      if (!date) {
        setShowPicker(null)
        return
      }
      if (showPicker === "start") {
        setStartDate(date)
      } else if (showPicker === "end") {
        setEndDate(date)
      } else if (showPicker === "time") {
        setTimes((prev) => [...prev, date])
      }
      setShowPicker(null)
      setErrors({})
    },
    [showPicker],
  )

  const refreshAccessToken = useCallback(
    async (rToken: string) => {
      const res = await fetch(`${API_BASE_URL}/guardians/auth/renew`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${rToken}`,
        },
      })
      if (!res.ok) throw new Error(`Token refresh failed with status ${res.status}`)
      const json = await res.json()
      const newAccess = json.accessToken,
        newRefresh = json.refreshToken
      await AsyncStorage.setItem("accessToken", newAccess)
      await AsyncStorage.setItem("refreshToken", newRefresh)
      onTokenUpdate(newAccess, newRefresh)
      return newAccess
    },
    [onTokenUpdate],
  )

  const makeAuthenticatedRequest = useCallback(
    async (url: string, options: RequestInit, token: string) => {
      let response = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } })
      if (response.status === 401 && refreshToken) {
        const newToken = await refreshAccessToken(refreshToken)
        response = await fetch(url, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
        })
      }
      return response
    },
    [refreshToken, refreshAccessToken],
  )

  // 날짜를 YYYY-MM-DD 형식으로 포맷하는 함수
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // 시간을 HH:MM 형식으로 포맷하는 함수
  const formatTimeToString = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
  }

  const handleSubmitSchedules = useCallback(async () => {
    // takerIdx 유효성 검사
    if (!takerIdx || takerIdx === 0) {
      Alert.alert("오류", "takerIdx가 유효하지 않습니다. 사용자를 다시 선택해주세요.")
      return
    }

    if (medicines.length === 0) {
      Alert.alert("등록 필요", "최소 하나 이상의 약을 추가하세요.")
      return
    }

    setIsSubmitting(true)

    const schedules = medicines.map((med) => {
      const noticeTime = med.times.map((time) => formatTimeToString(time))
      return {
        title: med.title,
        description: `${med.title} 복용 알림`,
        startTime: formatDateToString(med.startDate),
        endTime: formatDateToString(med.endDate),
        noticeTime,
      }
    })

    const requestBody = {
      takerIdx: Number(takerIdx),
      schedules,
    }

    // 추가 디버깅 정보
    console.log("Submitting with takerIdx:", takerIdx, "Type:", typeof takerIdx)
    console.log("Request body:", JSON.stringify(requestBody, null, 2))

    try {
      // 요청 데이터 로깅
      console.log("Request body:", JSON.stringify(requestBody, null, 2))
      setDebugInfo(`Request body:\n${JSON.stringify(requestBody, null, 2)}`)

      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/guardians/data/schedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        authToken,
      )

      // 서버 응답 텍스트 읽기
      const text = await response.text()
      console.log("Response text:", text)

      // JSON으로 파싱 시도
      let jsonResponse: any = null
      try {
        jsonResponse = JSON.parse(text)
      } catch (parseError) {
        console.log("Failed to parse response as JSON:", parseError)
      }

      // 디버그 정보 업데이트
      setDebugInfo(
        `Request body:\n${JSON.stringify(requestBody, null, 2)}\n\n` +
          `Status: ${response.status}\n\n` +
          `Response headers:\n${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}\n\n` +
          `Raw response:\n${text}` +
          (jsonResponse ? `\n\nParsed response:\n${JSON.stringify(jsonResponse, null, 2)}` : ""),
      )

      if (!response.ok) {
        const errorMessage = jsonResponse?.message || jsonResponse?.error || text || `HTTP ${response.status}`
        Alert.alert("생성 실패", `서버 오류 (${response.status}):\n${errorMessage}`)
        throw new Error(`Failed with status ${response.status}: ${errorMessage}`)
      }

      Alert.alert("완료", "일정이 생성되었습니다.", [{ text: "확인", onPress: onClose }])
    } catch (err: any) {
      console.error("Schedule creation error:", err)
      const errorInfo = `Exception:\n${err.message}\n\nStack:\n${err.stack}`
      setDebugInfo((prev) => `${prev}\n\n${errorInfo}`)
      Alert.alert("오류", err.message || "일정 생성에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }, [medicines, authToken, takerIdx, onClose, makeAuthenticatedRequest])

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <XMarkIcon size={24} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>약 등록</Text>
              <Text style={styles.headerTitle}>사용자 ID: {takerIdx || "미설정"}</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 약 이름 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>약 이름 *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={title}
                onChangeText={settitle}
                placeholder="약 이름을 입력하세요"
                placeholderTextColor="#9CA3AF"
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>
            {/* 복용 기간 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>복용 기간 *</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.dateButton, errors.range && styles.inputError]}
                  onPress={() => setShowPicker("start")}
                >
                  <Text style={styles.dateButtonText}>{startDate.toLocaleDateString()}</Text>
                  <View style={styles.iconWrapper}>
                    <CalendarDaysIcon size={18} color="#6366F1" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.dateSeparatorText}>~</Text>
                <TouchableOpacity
                  style={[styles.dateButton, errors.range && styles.inputError]}
                  onPress={() => setShowPicker("end")}
                >
                  <Text style={styles.dateButtonText}>{endDate.toLocaleDateString()}</Text>
                  <View style={styles.iconWrapper}>
                    <CalendarDaysIcon size={18} color="#6366F1" />
                  </View>
                </TouchableOpacity>
              </View>
              {errors.range && <Text style={styles.errorText}>{errors.range}</Text>}
            </View>
            {/* 알람 시간 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>알람 시간 *</Text>
              <TouchableOpacity style={styles.timeAddButton} onPress={() => setShowPicker("time")}>
                <PlusIcon size={16} color="#6366F1" />
                <Text style={styles.timeAddButtonText}>시간 추가</Text>
              </TouchableOpacity>
              {errors.times && <Text style={styles.errorText}>{errors.times}</Text>}
              <View style={styles.timeListRow}>
                {times.map((t, i) => (
                  <View key={i} style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>{formatTimeToString(t)}</Text>
                    <TouchableOpacity onPress={() => setTimes((prev) => prev.filter((_, idx) => idx !== i))}>
                      <XMarkIcon size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
            {/* 약 추가 버튼 */}
            <TouchableOpacity style={styles.addMedicineButton} onPress={handleAddMedicine}>
              <PlusIcon size={18} color="#fff" />
              <Text style={styles.addMedicineButtonText}>약 추가</Text>
            </TouchableOpacity>
            {/* 등록된 약물 리스트 */}
            {medicines.length > 0 && (
              <View style={styles.listContainer}>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>등록된 약물</Text>
                  <Text style={styles.countText}>{medicines.length}</Text>
                </View>
                {medicines.map((med) => (
                  <View key={med.id} style={styles.listItem}>
                    <View style={styles.medicineInfo}>
                      <Text style={styles.medicineTitle}>{med.title}</Text>
                      <Text style={styles.medicineDetail}>
                        {formatDateToString(med.startDate)} ~ {formatDateToString(med.endDate)}
                      </Text>
                      <Text style={styles.medicineDetail}>
                        알림: {med.times.map((t) => formatTimeToString(t)).join(", ")}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setMedicines((prev) => prev.filter((x) => x.id !== med.id))}>
                      <XMarkIcon size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
          {/* 디버깅 정보 */}
          {debugInfo && (
            <ScrollView style={styles.debugContainer}>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </ScrollView>
          )}
          {/* 제출 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, (medicines.length === 0 || isSubmitting) && styles.disabledButton]}
              onPress={handleSubmitSchedules}
              disabled={medicines.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckIcon size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>등록 완료</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {showPicker && (
            <DateTimePicker
              value={showPicker === "time" ? new Date() : showPicker === "start" ? startDate : endDate}
              mode={showPicker === "time" ? "time" : "date"}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={showPicker === "end" ? startDate : undefined}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    marginTop: 6,
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  dateSeparator: {
    paddingHorizontal: 12,
  },
  dateSeparatorText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  iconWrapper: {
    backgroundColor: '#EEF2FF',
    padding: 6,
    borderRadius: 8,
  },
  timeAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addIconWrapper: {
    backgroundColor: '#EEF2FF',
    padding: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  timeAddButtonText: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 15,
  },
  timeListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  timeBadge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  timeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  addMedicineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addMedicineButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 4,
    borderRadius: 6,
  },
  listContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemContent: {
    flex: 1,
  },
  medicineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  medicinePeriod: {
    fontSize: 14,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  debugContainer: { maxHeight: 120, margin: 8, padding: 8, backgroundColor: '#feeceb', borderRadius: 8 },
  debugText: { color: '#c00', fontSize: 12, lineHeight: 18 },
  medicineInfo: {
    flex: 1,
  },
  medicineDetail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
});
