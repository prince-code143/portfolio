# Prince Sukhwal — Portfolio Website

Robotics, home automation aur IoT projects ki portfolio website. GitHub Pages par free host hoti hai aur `admin.html` se poori customize hoti hai.

## Files

| File / folder | Kaam |
|---|---|
| `index.html` | Home page (original template jaisa hi) |
| `projects.html` | Saare projects, category filter aur search |
| `project.html` | Ek project ka page: photos, YouTube videos, description |
| `admin.html` | Site editor (text, photos, projects, videos) |
| `data/content.js` | Site ka saara content. Admin panel isi ko update karta hai |
| `assets/img/` | Template ki original photos |
| `assets/uploads/` | Admin se upload ki gayi photos yahan save hoti hain |
| `sw.js` | Dobara visit par site turant khulti hai |

## 1. GitHub par host karna (ek baar)

1. [github.com](https://github.com) par account banayein.
2. **New repository** banayein.
   - Naam `USERNAME.github.io`(Prince_Sukhwal.github.io) rakhenge to site `https://USERNAME.github.io` par khulegi.
   - Koi aur naam (jaise `portfolio`) rakhenge to site `https://USERNAME.github.io/portfolio` par khulegi.
   - Repository **Public** rakhein.
3. Repository mein **Add file → Upload files** dabayein.
4. Is ZIP ko unzip karein. Andar ki **saari files aur folders** (sirf `portfolio-site` folder nahi, uske andar ka saman) drag karke daalein, phir **Commit changes** dabayein.
   - `.nojekyll` file bhi upload honi chahiye. Agar computer par dikh nahi rahi, to GitHub par **Add file → Create new file** se `.nojekyll` naam ki khali file bana dein.
5. **Settings → Pages** mein jaayein. Source: **Deploy from a branch**, Branch: **main**, folder: **/(root)**. **Save** dabayein.
6. 1–2 minute baad upar diya gaya link khulega.

## 2. Admin panel jodna (ek baar)

1. `https://USERNAME.github.io/admin.html` kholein (project site ho to `/portfolio/admin.html`).
2. Left menu mein **Publishing (GitHub)** kholein.
3. Wahan diye steps se **fine-grained token** banayein: sirf is repository ka access, aur **Contents: Read and write** permission.
4. Username, repository name aur token daalein, phir **Save & test connection** dabayein.

Token sirf aapke browser mein rehta hai, website ki files mein kabhi nahi jaata. Kisi ko share na karein.

## 3. Roz ka kaam

- **Naya project:** Projects → New project → title, category, tags, summary → cover photo → gallery photos drag karein → YouTube link paste karein → description likhein.
- **Photo badalna:** Kisi bhi photo par **Replace** dabayein. Badi photo apne aap chhoti (WebP) ho jaati hai, isliye site fast rehti hai.
- **Home page par dikhana:** Project list mein ⭐ dabayein. Order badalne ke liye drag karein.
- **Preview:** Upar **Preview** dabayein. Live site par kuch nahi badalta.
- **Publish:** Upar **Publish** dabayein. 1–2 minute mein site update ho jaati hai. Purana dikhe to `Ctrl + Shift + R` se reload karein.

Edits browser mein draft ki tarah apne aap save hote rehte hain. Tab band ho jaaye to bhi agli baar wahi se shuru hoga (usi browser mein).

## YouTube videos

Video YouTube par **Public** ya **Unlisted** upload karein, phir link project mein paste karein. Ye sab links chalte hain:

- `https://www.youtube.com/watch?v=XXXXXXXXXXX`
- `https://youtu.be/XXXXXXXXXXX`
- `https://www.youtube.com/shorts/XXXXXXXXXXX`

Page par pehle sirf thumbnail aata hai. Visitor play dabaye tabhi video load hota hai, isliye page slow nahi hota.

## Description formatting

```
## Heading
**bold text**
- list item
1. step one
[link text](https://example.com)
```

Paragraphs ke beech ek khali line chhodein.

## Contact form

Default: form visitor ka email app kholta hai. Messages seedhe inbox mein chahiye to [formspree.io](https://formspree.io) par free form banayein aur uska link **Contact & social → Form service link** mein daalein.

## Bina token ke update

**Backup & restore → Download update package (.zip)** dabayein. ZIP unzip karke `data` aur `assets` folders GitHub par **Upload files** se daal dein.

## Computer par dekhna

`index.html` double-click karke khul jaata hai. Admin panel aur preview ke liye chhota local server chahiye:

```
python -m http.server 8000
```

phir `http://localhost:8000/admin.html` kholein.

## Backup

Bade badlav se pehle **Backup & restore → Download backup** zaroor karein.
