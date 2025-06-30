"use client"

import { View, Text, Image } from "react-native"
import { TouchableOpacity } from "react-native"
import { styles } from "./styles"

interface HighlightWord {
  text: string
  highlight: string[]
}

interface SlideProps {
  item: {
    id: string
    image: any
    title: string
    subtitle: string
    description?: string
    renderCustom?: () => JSX.Element
  }
}

export function OnboardingSlide({ item }: SlideProps) {
  return (
    <View style={styles.slide}>
      <Image
        source={item.image}
        style={
          item.id === "2" || item.id === "3" || item.id === "1"
            ? styles.illustrationImageSmall
            : item.id === "4"
              ? styles.illustrationImageLarge
              : styles.illustrationImage
        }
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
        {item.renderCustom ? item.renderCustom() : <Text style={styles.description}>{item.description}</Text>}
      </View>
    </View>
  )
}

export function BulletPoint({ text, highlight }: HighlightWord) {
  return (
    <View style={styles.bulletPoint}>
      <View style={styles.bullet} />
      {colorizeText(text, highlight)}
    </View>
  )
}

export function StartSection({ onStartPress }: { onStartPress: () => void }) {
  return (
    <View style={styles.startContainer}>
      <Text style={styles.startTitle}>지금 시작해보세요!</Text>
      <Text style={styles.startSub}>
        지금 바로 PILL TIME과 함께{"\n"}
        안전한 복약 관리를 시작해보세요.
      </Text>
      <TouchableOpacity style={styles.startButton} activeOpacity={0.8} onPress={onStartPress}>
        <Text style={styles.startButtonText1}>시작하기</Text>
      </TouchableOpacity>
    </View>
  )
}

const colorizeText = (text: string, highlightWords: string[]): JSX.Element => {
  if (!highlightWords || highlightWords.length === 0) {
    return <Text style={styles.bulletText}>{text}</Text>
  }

  const result: JSX.Element[] = []
  let lastIndex = 0

  highlightWords.forEach((word: string) => {
    const index = text.indexOf(word, lastIndex)
    if (index !== -1) {
      if (index > lastIndex) {
        result.push(
          <Text key={`${lastIndex}-plain`} style={styles.bulletText}>
            {text.substring(lastIndex, index)}
          </Text>,
        )
      }

      result.push(
        <Text key={`${index}-highlight`} style={styles.highlightText}>
          {word}
        </Text>,
      )

      lastIndex = index + word.length
    }
  })

  if (lastIndex < text.length) {
    result.push(
      <Text key={`${lastIndex}-plain-end`} style={styles.bulletText}>
        {text.substring(lastIndex)}
      </Text>,
    )
  }

  return (
    <Text style={styles.bulletText}>
      <>{result}</>
    </Text>
  )
}
