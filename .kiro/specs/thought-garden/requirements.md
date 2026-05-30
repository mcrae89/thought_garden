# Requirements Document

## Introduction

Thought Garden is a mobile journaling application that gamifies daily reflection by rewarding users with emotion-based seeds. Users write journal entries, select the emotions associated with their writing, and earn seeds that can be planted in a virtual garden. Plants grow through daily watering (driven by journal entries) and their type and color are determined by the emotions of the entries that earned them. The MVP targets Android with local-first data storage, cloud sync, and offline support.

## Glossary

- **App**: The Thought Garden mobile application
- **Entry**: A text-based journal entry created by the user
- **Primary_Emotion**: The dominant emotion selected by the user for a journal entry, chosen from the 30-emotion set
- **Secondary_Emotion**: Additional emotions present in a journal entry beyond the primary emotion, chosen from the 30-emotion set
- **Seed**: A collectible reward earned through journaling achievements, typed by the primary emotion of the entry that earned it
- **Plant**: A virtual plant grown from a seed in the user's garden, with type determined by the seed's emotion and color variation determined by secondary emotions
- **Garden**: A grid-based virtual space where users plant and grow plants
- **Plot**: A single cell in the garden grid where one plant can be placed
- **Greenhouse**: A storage area for plants that have begun growing, where plants are held in stasis (no growth, no decay)
- **Watering**: The act of nurturing all planted garden plants, triggered automatically by completing a daily journal entry
- **Growth_Stage**: One of four plant lifecycle phases: Seed, Sprout, Full, Bloom
- **Achievement**: A predefined milestone that triggers seed rewards when reached
- **Free_Tier**: The default access level with limited plot space and greenhouse capacity
- **Paid_Tier**: The premium access level with expanded plot space and greenhouse capacity
- **Sync**: The process of reconciling local data with cloud storage when connectivity is available
- **Emotion_Set**: The complete set of 30 emotions available for selection in the App

### Emotion-to-Plant Mapping

The following table defines the canonical mapping between each emotion and its corresponding plant species visual. Each emotion maps to exactly one distinct plant species.

| # | Emotion | Plant Species | Symbolism Basis |
|---|---------|--------------|-----------------|
| 1 | Happy | Sunflower | Radiates joy and positivity |
| 2 | Sad | Bleeding Heart | Drooping heart-shaped flowers evoke melancholy |
| 3 | Angry | Cactus | Thorny, defensive exterior |
| 4 | Anxious | Passionflower | Intricate tangled tendrils and tightly coiled buds evoke anxiety |
| 5 | Calm | Lavender | Known for soothing properties |
| 6 | Grateful | Hydrangea | Represents heartfelt gratitude |
| 7 | Love | Rose | Universal symbol of love |
| 8 | Hope | Daffodil | First bloom of spring, new beginnings |
| 9 | Excited | Bird of Paradise | Vibrant, exotic energy |
| 10 | Lonely | Forget-Me-Not | Longing for connection |
| 11 | Proud | Orchid | Elegance and accomplishment |
| 12 | Confused | Wisteria | Tangled, cascading vines |
| 13 | Peaceful | Lotus | Serenity and spiritual calm |
| 14 | Nostalgic | Cherry Blossom | Fleeting beauty of the past |
| 15 | Jealous | Nightshade | Beautiful but toxic, alluring and dangerous |
| 16 | Inspired | Iris | Named for the goddess of messages |
| 17 | Guilty | Thistle | Prickly self-reproach |
| 18 | Curious | Snapdragon | Playful, opening to reveal secrets |
| 19 | Frustrated | Bramble | Tangled, thorny obstruction |
| 20 | Content | Chamomile | Gentle satisfaction and ease |
| 21 | Overwhelmed | Morning Glory | Spreads rapidly and covers everything, hard to contain |
| 22 | Brave | Protea | Bold, striking, resilient bloom |
| 23 | Embarrassed | Mimosa (Sensitive Plant) | Shrinks when touched |
| 24 | Surprised | Jack-in-the-Pulpit | Unexpected, dramatic form |
| 25 | Bored | Dandelion | Drifts away, restless and fleeting |
| 26 | Determined | Gladiolus | Tall upright stem, blooms sequentially from base to tip |
| 27 | Compassionate | Aloe Vera | Healing and nurturing others |
| 28 | Melancholy | Bluebell | Quiet, reflective sadness |
| 29 | Joyful | Daisy | Simple, pure happiness |
| 30 | Vulnerable | Snowdrop | Fragile first bloom, delicate and exposed |

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely log in to the app, so that my journal entries and garden are private and accessible only to me.

#### Acceptance Criteria

1. WHERE the App is running in a development environment, THE App SHALL provide email and password authentication
2. WHERE the App is running in a production environment, THE App SHALL provide OAuth authentication using the device operating system's native provider
3. WHEN a user successfully authenticates, THE App SHALL grant access to the user's entries, seeds, garden, and greenhouse
4. IF authentication fails, THEN THE App SHALL display an error message indicating the reason for failure (invalid credentials, network unavailable, or account not found) and allow the user to retry
5. IF a user fails authentication 5 consecutive times, THEN THE App SHALL temporarily lock the account for 15 minutes before allowing further attempts
6. THE App SHALL persist the authentication session across app restarts until the user explicitly logs out
7. WHILE the device has no network connectivity and a valid session exists locally, THE App SHALL allow continued access using the locally persisted session
8. IF the device has no network connectivity and no valid local session exists, THEN THE App SHALL display a message indicating that network connectivity is required to authenticate

### Requirement 2: Create Journal Entry

**User Story:** As a user, I want to write a daily journal entry, so that I can reflect on my thoughts and emotions.

#### Acceptance Criteria

1. WHEN a user creates a new entry, THE App SHALL provide a text input field for the journal content with a maximum length of 10,000 characters
2. WHEN a user submits an entry, THE App SHALL require the user to select exactly one Primary_Emotion from the Emotion_Set (Happy, Sad, Angry, Anxious, Calm, Grateful, Love, Hope, Excited, Lonely, Proud, Confused, Peaceful, Nostalgic, Jealous, Inspired, Guilty, Curious, Frustrated, Content, Overwhelmed, Brave, Embarrassed, Surprised, Bored, Determined, Compassionate, Melancholy, Joyful, Vulnerable)
3. WHEN a user submits an entry, THE App SHALL allow the user to optionally select one or more Secondary_Emotions from the Emotion_Set (excluding the selected Primary_Emotion)
4. WHILE the user is on the Free_Tier, THE App SHALL limit entry creation to one entry per calendar day based on the device's local timezone
5. IF a Free_Tier user attempts to create an entry after reaching the daily limit, THEN THE App SHALL prevent submission and display a message indicating the limit has been reached and when the next entry can be created
6. WHILE the user is on the Paid_Tier, THE App SHALL allow unlimited entries per calendar day
7. IF a user attempts to submit an entry with fewer than 1 character of non-whitespace content, THEN THE App SHALL prevent submission and indicate that entry content is required
8. WHEN an entry is successfully submitted, THE App SHALL store the entry with its associated emotions, timestamp, and user identifier

### Requirement 3: Edit and Delete Journal Entries

**User Story:** As a user, I want to edit or delete past journal entries, so that I can correct mistakes or remove entries I no longer want.

#### Acceptance Criteria

1. WHEN a user selects an existing entry for editing, THE App SHALL allow modification of the text content and emotion selections while enforcing the same emotion rules as entry creation (exactly one Primary_Emotion from the Emotion_Set and optionally one or more Secondary_Emotions from the Emotion_Set excluding the selected Primary_Emotion)
2. WHEN a user saves an edited entry, THE App SHALL update the stored entry with the new content and emotions while preserving the original creation timestamp and adding a last-modified timestamp
3. WHEN a user requests deletion of an entry, THE App SHALL prompt for confirmation before removing the entry, and SHALL preserve the entry unchanged if the user cancels the confirmation
4. WHEN a user confirms deletion, THE App SHALL permanently remove the entry from storage while retaining any Seeds or Achievements that were previously earned from that entry
5. WHEN a user edits an entry's Primary_Emotion, THE App SHALL NOT modify the emotion type of any Seed previously earned from that entry

### Requirement 4: Seed Rewards via Achievements

**User Story:** As a user, I want to earn seeds by reaching journaling milestones, so that I am motivated to journal consistently.

#### Acceptance Criteria

**General:**

1. WHEN an Achievement is triggered, THE App SHALL add one Seed of the determined emotion type to the user's seed inventory
2. THE App SHALL allow unlimited seed storage in the user's inventory
3. WHEN an Achievement is earned and a Seed is awarded, THE App SHALL display an in-app notification indicating the Achievement name and the emotion type of the awarded Seed
4. IF multiple Achievements are triggered by a single action, THEN THE App SHALL award each Seed independently and display a notification for each Achievement earned
5. IF a tie occurs when determining "most frequently used" or "most common" emotion, THEN THE App SHALL select the tied emotion that was used most recently

**One-Time Entry Achievements (earned once, never reset):**

6. WHEN a user submits their first-ever journal entry, THE App SHALL award one Seed typed to that entry's Primary_Emotion
7. WHEN a user submits their 10th, 50th, or 100th journal entry, THE App SHALL award one Seed typed to that milestone entry's Primary_Emotion
8. WHEN a user selects a specific emotion as Primary_Emotion for the first time, THE App SHALL award one Seed of that emotion type
9. WHEN a user has selected all 30 emotions as Primary_Emotion at least once, THE App SHALL award one Seed typed to the user's most frequently used Primary_Emotion
10. WHEN a user submits an entry with 200 or more words for the first time, THE App SHALL award one Seed typed to that entry's Primary_Emotion
11. WHEN a user adds Secondary_Emotions to an entry for the first time, THE App SHALL award one Seed typed to that entry's Primary_Emotion

**One-Time Time-Based Achievements (earned once, never reset):**

12. WHEN a user submits an entry between 05:00 and 11:59 local device time for the first time, THE App SHALL award one Seed typed to that entry's Primary_Emotion (Morning Achievement)
13. WHEN a user submits an entry between 18:00 and 23:59 local device time for the first time, THE App SHALL award one Seed typed to that entry's Primary_Emotion (Evening Achievement)
14. WHEN a user submits an entry on a Saturday or Sunday (local device time) for the first time, THE App SHALL award one Seed typed to that entry's Primary_Emotion (Weekend Achievement)

**One-Time Garden Achievements (earned once, never reset):**

15. WHEN a user's plant reaches the Bloom Growth_Stage for the first time, THE App SHALL award one Seed typed to the emotion of the bloomed plant
16. WHEN a user fills all available garden plots for the first time, THE App SHALL award one Seed typed to the most common emotion among the planted garden plants
17. WHEN a user has grown at least one plant of each of the 30 emotion types, THE App SHALL award one Seed typed to the most common emotion among the user's garden plants

**Repeatable Achievements:**

18. WHEN a user achieves a journaling streak of 3, 7, 14, or 30 consecutive calendar days (at least one entry per calendar day in local device time), THE App SHALL award one Seed typed to the streak-completing entry's Primary_Emotion
19. IF a user has previously earned a streak Achievement and subsequently has 30 or more consecutive calendar days without an entry, THEN THE App SHALL reset that streak Achievement, allowing it to be earned again
20. WHEN a user submits an entry after 7 or more consecutive calendar days without journaling, THE App SHALL award one Seed typed to that entry's Primary_Emotion (Returning Achievement)
21. WHEN a user submits 5 consecutive entries (by submission timestamp, regardless of time span) with the same Primary_Emotion, THE App SHALL award one Seed of that consistent emotion type (Consistent Theme Achievement)

**One-Time Emotion Milestone Achievements:**

22. WHEN a user accumulates 10, 25, or 50 lifetime entries with the same Primary_Emotion, THE App SHALL award one Seed of that emotion type
23. IF a journal entry that contributed to an already-earned Achievement is deleted or its Primary_Emotion is edited, THEN THE App SHALL NOT revoke the previously awarded Seed

### Requirement 5: Garden Management

**User Story:** As a user, I want to plant seeds and arrange plants in my garden, so that I can visualize my journaling journey.

#### Acceptance Criteria

1. THE App SHALL display the garden as a grid-based layout styled to resemble tilled earth
2. WHILE the user is on the Free_Tier, THE App SHALL provide 9 plots in the garden arranged in a 3x3 grid
3. WHILE the user is on the Paid_Tier, THE App SHALL provide 25 plots in the garden arranged in a 5x5 grid
4. WHEN a user selects a seed from inventory and an empty plot, THE App SHALL plant the seed in that plot and remove the seed from the user's inventory
5. WHEN a user drags a plant to a different empty plot, THE App SHALL move the plant to the new position and leave the original plot empty
6. THE App SHALL display each plant at its current Growth_Stage with the visual appearance determined by its emotion type and color variation
7. IF a user attempts to plant a seed when all garden plots are occupied, THEN THE App SHALL indicate that no empty plots are available and retain the seed in inventory
8. IF a user drags a plant to an occupied plot, THEN THE App SHALL cancel the drag action and return the plant to its original position

### Requirement 6: Plant Growth and Watering

**User Story:** As a user, I want my plants to grow when I journal daily, so that I see tangible progress from my reflection habit.

#### Acceptance Criteria

1. WHEN a user submits a journal entry, THE App SHALL water all plants currently in the garden
2. THE App SHALL advance each plant by at most one Growth_Stage per calendar day (from Seed to Sprout, Sprout to Full, or Full to Bloom), triggered by the first watering event of that day
3. WHILE a plant is at the Bloom Growth_Stage, THE App SHALL maintain the plant at Bloom regardless of additional watering
4. THE App SHALL NOT cause plants to die, wilt, or degrade under any circumstances
5. WHEN a seed is planted in the garden after the day's first journal entry has already been submitted, THE App SHALL leave the newly planted seed at the Seed Growth_Stage until the next watering event

### Requirement 7: Plant Appearance

**User Story:** As a user, I want my plants to look different based on the emotions of my journal entries, so that my garden reflects my emotional journey.

#### Acceptance Criteria

1. THE App SHALL determine the plant type (species visual) based on the Seed's Primary_Emotion, where each Primary_Emotion maps to exactly one distinct plant species visual
2. THE App SHALL determine the plant's color variation based on the Secondary_Emotions of the entry that earned the Seed, where the color variation is fixed at the time the Seed is awarded and does not change if the entry is later edited
3. IF a Seed's entry has multiple Secondary_Emotions, THEN THE App SHALL derive the color variation from the first Secondary_Emotion selected by the user
4. WHEN a Seed has no associated Secondary_Emotions, THE App SHALL display the plant in its default color for that emotion type
5. THE App SHALL provide visually distinct plant types for each of the 30 emotions in the Emotion_Set, as defined in the Emotion-to-Plant Mapping table
6. THE App SHALL maintain the plant's species visual and color variation consistently across all four Growth_Stages (Seed, Sprout, Full, Bloom)

### Requirement 8: Greenhouse Storage

**User Story:** As a user, I want to move growing plants to storage, so that I can manage my garden space without losing progress.

#### Acceptance Criteria

1. WHEN a user moves a plant from the garden to the greenhouse, THE App SHALL place the plant in stasis (no growth, no decay)
2. WHEN a user moves a plant from the greenhouse back to the garden, THE App SHALL resume the plant at its stored Growth_Stage and require the user to select an empty plot for placement
3. WHILE the user is on the Free_Tier, THE App SHALL provide greenhouse storage for a maximum of 3 plants
4. WHILE the user is on the Paid_Tier, THE App SHALL provide greenhouse storage for a maximum of 10 plants
5. IF the greenhouse is at full capacity and the user attempts to store a plant, THEN THE App SHALL display a message indicating the greenhouse is full and offer the option to revert the plant to a Seed and return the Seed to inventory
6. WHEN a user chooses to revert a plant to a Seed, THE App SHALL prompt for confirmation, then remove the plant and add a Seed of the same emotion type to the user's inventory
7. IF a user attempts to move a plant from the greenhouse to the garden and no empty plot is available, THEN THE App SHALL display a message indicating no empty plots are available and keep the plant in the greenhouse

### Requirement 9: Offline Support and Data Sync

**User Story:** As a user, I want to use the app without internet connectivity, so that I can journal and manage my garden anywhere.

#### Acceptance Criteria

1. THE App SHALL store all user data (entries, seeds, garden state, greenhouse state) locally on the device
2. WHILE the device has no network connectivity, THE App SHALL allow full functionality including entry creation, garden management, and greenhouse operations
3. WHEN network connectivity is restored, THE App SHALL initiate synchronization of local data with cloud storage within 30 seconds and display a sync status indicator to the user upon completion
4. IF a sync conflict occurs between local and cloud data, THEN THE App SHALL resolve the conflict by preserving the action with the most recent device-generated timestamp and notify the user that a conflict was resolved
5. THE App SHALL encrypt user data both at rest (local storage) and in transit (cloud sync)
6. IF synchronization fails after 3 retry attempts, THEN THE App SHALL retain all local data unchanged, display an error message indicating sync failure, and reattempt synchronization the next time network connectivity is detected

### Requirement 10: Data Privacy and Security

**User Story:** As a user, I want my journal entries to be private and secure, so that I feel safe expressing my thoughts.

#### Acceptance Criteria

1. THE App SHALL encrypt all user data stored locally on the device, including entries, emotions, seeds, garden state, and greenhouse state
2. THE App SHALL transmit all data to cloud storage over encrypted connections
3. THE App SHALL restrict access to user data exclusively to the authenticated user who created the data
4. IF a request is made with an expired, invalid, or unrecognized authentication session, THEN THE App SHALL deny the request, log the attempt including timestamp and request type, and display a message to the user indicating that re-authentication is required
5. WHEN a user explicitly logs out, THE App SHALL remove all unencrypted user data from local device storage within 5 seconds
