# Quick Test Guide - Screenshot Parsing Feature

## Prerequisites
✅ Backend is running on port 8000
✅ Client is running (web or mobile)
✅ Tesseract OCR is installed (`brew install tesseract` on macOS)

## Test Scenario: Upload and Parse a Screenshot

### Step 1: Prepare Test Screenshot
Use any screenshot that contains location text, such as:
- Instagram post mentioning a place
- Google Maps screenshot
- Photo with location caption
- Restaurant menu with address

**Example text that should work:**
```
📍 Santorini, Greece
Beautiful sunset at Oia Village
Visit Ammoudi Bay for fresh seafood
Located at Fira Town Square
```

### Step 2: Test the Upload

1. **Open the app** in browser (http://localhost:8081) or mobile
2. **Login** (use demo login for quick access)
3. **Navigate** to the "Locations" tab
4. **Click** "Pick Screenshot" button
5. **Select** your test image
6. **Click** "Parse Screenshot"

### Step 3: Expected Results

#### ✅ Success Indicators
- Loading indicator appears briefly
- Results section appears with:
  - "Source Information" box showing:
    - Platform: screenshot
    - Locations Found: X
    - Parsed content preview
  - List of detected locations with:
    - Location name
    - Address
    - Coordinates (latitude, longitude)
    - Confidence score

#### ❌ If You See Errors

**422 Unprocessable Entity**
- OLD BUG (should be fixed now)
- If still occurring, check browser console for details

**Could not extract text from image**
- Image quality too poor
- Try a clearer screenshot
- Check if Tesseract is installed: `tesseract --version`

**No Locations Found**
- The text didn't match any location patterns
- Try an image with clearer location keywords
- Use location emojis (📍) or place names

### Step 4: Save Locations

1. **Review** the detected locations
2. **Click** "Save All" to save all locations, or
3. **Click** "Save" on individual locations
4. **Navigate** to Map tab
5. **Verify** locations appear on the map

### Step 5: Verify on Map

- Go to "Map" tab
- Your saved locations should appear as markers
- Click markers to see location details
- Verify coordinates are correct

## Test Results Template

```
Date: _____________
Platform: [ ] Web  [ ] Mobile (iOS/Android)

Test 1: Upload Screenshot
- Screenshot uploaded: [ ] Yes  [ ] No
- Parsing started: [ ] Yes  [ ] No
- Results received: [ ] Yes  [ ] No
- Locations found: ___ 
- Accuracy: [ ] Good  [ ] Poor

Test 2: Save Locations
- Individual save works: [ ] Yes  [ ] No
- Save all works: [ ] Yes  [ ] No
- Locations appear on map: [ ] Yes  [ ] No

Test 3: Multilingual Support
Languages tested:
- [ ] English
- [ ] Spanish  
- [ ] French
- [ ] Vietnamese
- [ ] Chinese
- [ ] Other: _________

Overall Result: [ ] PASS  [ ] FAIL

Notes:
_________________________________
_________________________________
```

## Advanced Tests

### Test Different Screenshot Types
1. **Instagram story** with location tag
2. **Google Maps** route screenshot
3. **Restaurant post** with address
4. **Travel blog** screenshot
5. **Event poster** with venue

### Test Multilingual Content
1. **Spanish:** "Ubicación: Barcelona, España"
2. **Vietnamese:** "Địa chỉ: Hồ Chí Minh"
3. **Chinese:** "位置：北京"
4. **French:** "Emplacement: Paris, France"

### Test Edge Cases
1. **Multiple locations** in one screenshot
2. **Poor quality** image
3. **Rotated** screenshot
4. **Screenshot with noise** (lots of non-location text)

## Debugging Tips

### Check Backend Logs
```bash
cd backend
tail -f backend.log
```

Look for:
- "Screenshot parse by user X"
- "Parsed X geocoded locations"
- Any error messages

### Check Network Request
Open browser DevTools → Network tab
- Look for POST to `/parse-screenshot`
- Check request payload has file
- Check response status (should be 200)

### Test Backend Directly
```bash
# Create a test image (if needed)
curl -X POST http://localhost:8000/parse-screenshot \
  -H "Authorization: Bearer demo" \
  -F "file=@/path/to/screenshot.jpg"
```

## Success Criteria

✅ Upload works on web and mobile
✅ OCR extracts text correctly
✅ Locations are detected and geocoded
✅ Saved locations appear on map
✅ No 422 errors
✅ Multilingual screenshots work

## Report Issues

If tests fail, include:
1. Platform (web/mobile)
2. Error message
3. Screenshot of issue
4. Backend logs
5. Browser console errors (if web)
