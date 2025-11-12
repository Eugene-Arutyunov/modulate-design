# Contents

The interface consists of three interconnected components. This codebase is needed to demonstrate the design to developers, so here we focus on layout, and we switch component states manually.

The components are as follows:
1. Media Box (.media-box)
2. Summary Cards (.summary-cards)
3. Transcript Container (.transcript-container)

# Scenario

The user uploads an audio or video file. (We use only audio, but we can extract it from video files.)

The system analyzes the audio and detects exact target behaviors. Then the system processes the results and displays them in the interface. 


# Demo Shortcuts

A special function is needed to change the system state from the keyboard, allowing the design of components to be displayed in different states. The function should listen to the keyboard and respond to number key presses.

Key 1 - waiting for upload
Key 2 - file dropping
Key 3 - file uploading
Key 4 - file processing
Key 5 - audio sample 1
Key 6 - audio sample 2
Key 7 - audio sample 3



# Data structure

## Media

Media
- length, seconds (number)
- title (text)
- participants (text array)

### Title

### Participants

An inline text field that allows users to edit the name of each participant. Initially, they are set as "Participant 1", "Participant 2", etc. Each participant name is stored in the media object, so we can switch between audio samples.


## Clip

Clip
- time
- text
- participant
- behaviors




# Components

## Media Box Component

Uploading states
- waiting for upload
- file dropping
- file uploading
- file processing
- player is ready

Player states
- playing
- paused


шкала времени, справа общая длительность, вертикальная полоска, справа от неё текущее время
плей/пауза
громкость + горизонтальрая полоска


## Summary Cards Component

View Switcher:
- switches between the two view modes

Speakers view:
- each card (.summary-card) represents a person, detected behaviors are listed below

Behaviors view:
- each card (.summary-card) represents detected behavior, persons and occasions are listed below

## Transcript Container Component

Each transcript clip (.transcript-clip) represents a small fragment of the conversation with its associated behaviors and participant information. 




