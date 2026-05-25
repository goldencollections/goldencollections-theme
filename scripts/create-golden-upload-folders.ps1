param(
  [string]$RootPath = "C:\Golden-Product-Uploads",
  [switch]$OverwriteTemplates
)

$ErrorActionPreference = "Stop"

function New-Folder {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
    Write-Host "Created: $Path"
  } else {
    Write-Host "Exists:  $Path"
  }
}

function Write-TemplateFile {
  param(
    [string]$Path,
    [string[]]$Lines
  )

  if ((Test-Path -LiteralPath $Path) -and -not $OverwriteTemplates) {
    Write-Host "Exists:  $Path"
    return
  }

  $Lines | Set-Content -LiteralPath $Path -Encoding UTF8
  Write-Host "Created: $Path"
}

$workflowFolders = @(
  "00_New-Raw-Images",
  "10_Processed-Shopify-Ready",
  "20_Uploaded-To-Shopify",
  "90_Needs-Fixing",
  "reports"
)

$categoryLeaves = @(
  "01_Products\Deity-God-Jewellery\Varalakshmi-Collections\Varalakshmi-Idols",
  "01_Products\Deity-God-Jewellery\Varalakshmi-Collections\Varalakshmi-Idol-Faces",
  "01_Products\Deity-God-Jewellery\Varalakshmi-Collections\Hand-and-Legs-Ashtapatham",
  "01_Products\Deity-God-Jewellery\Varalakshmi-Collections\Vagamalai-Thomala",
  "01_Products\Deity-God-Jewellery\Necklace\Short-Necklace",
  "01_Products\Deity-God-Jewellery\Necklace\Long-Necklace",
  "01_Products\Deity-God-Jewellery\Crown-Mukut\Gold-Crowns",
  "01_Products\Deity-God-Jewellery\Crown-Mukut\Stone-Crowns",
  "01_Products\Deity-God-Jewellery\Crown-Mukut\Hair-Crowns",
  "01_Products\Deity-God-Jewellery\Crown-Mukut\Drama-Crowns",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Earrings",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Eyes",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Waist-Belts",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Arch-for-Crown",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Pustal-Tadu",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Pendants",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Nose-Rings",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Mustache",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Weapons",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Taira",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Bindi-Tilak",
  "01_Products\Deity-God-Jewellery\Deity-Accessories\Shanku-Chakra",
  "01_Products\Deity-God-Jewellery\Decorative-Items\Banana-Trees",
  "01_Products\Deity-God-Jewellery\Decorative-Items\Lotus",
  "01_Products\Deity-God-Jewellery\Decorative-Items\Stand",
  "01_Products\Premium-Deity-Jewellery\Jewellery\Long-Haram",
  "01_Products\Premium-Deity-Jewellery\Jewellery\Short-Necklace",
  "01_Products\Premium-Deity-Jewellery\Jewellery\Lockets-Pendants",
  "01_Products\Premium-Deity-Jewellery\Jewellery\Kasula-Mala",
  "01_Products\Premium-Deity-Jewellery\Jewellery\Nose-Ring",
  "01_Products\Premium-Deity-Jewellery\Jewellery\Shanku-Chakra",
  "01_Products\Premium-Deity-Jewellery\Jewellery\Taira",
  "01_Products\Bharatanatyam-Jewellery\Dance-Sets\Adults",
  "01_Products\Bharatanatyam-Jewellery\Dance-Sets\Kids",
  "01_Products\Bharatanatyam-Jewellery\Necklace\Short-Necklace",
  "01_Products\Bharatanatyam-Jewellery\Necklace\Long-Necklace",
  "01_Products\Bharatanatyam-Jewellery\Dance-Accessories\Ghungroo-Salangai",
  "01_Products\Bharatanatyam-Jewellery\Dance-Accessories\Bangles",
  "01_Products\Bharatanatyam-Jewellery\Dance-Accessories\Mattal-Matil-Mattel",
  "01_Products\Bharatanatyam-Jewellery\Dance-Accessories\Waist-Belts",
  "01_Products\Bharatanatyam-Jewellery\Dance-Accessories\Headset",
  "01_Products\Bharatanatyam-Jewellery\Dance-Accessories\Maang-Tikka-Nethichutti",
  "01_Products\Bharatanatyam-Jewellery\Dance-Accessories\Earrings-Jhumka",
  "01_Products\Bharatanatyam-Jewellery\Dance-Accessories\Nath",
  "01_Products\Bharatanatyam-Jewellery\Dance-Accessories\Baju-Band",
  "01_Products\Bharatanatyam-Jewellery\Hair-Accessories\Flowers-Gajra-Veni",
  "01_Products\Bharatanatyam-Jewellery\Hair-Accessories\Jada-Jada-Kuchulu",
  "01_Products\Bharatanatyam-Jewellery\Hair-Accessories\Buns-Rings",
  "01_Products\Bharatanatyam-Jewellery\Hair-Accessories\Rakodi",
  "01_Products\Bharatanatyam-Jewellery\Hair-Accessories\Sun-and-Moon",
  "01_Products\Bharatanatyam-Jewellery\Hair-Accessories\Crown",
  "01_Products\Bharatanatyam-Jewellery\Cosmetics",
  "01_Products\Bharatanatyam-Jewellery\Instruments",
  "01_Products\Kemp-Jewellery\Gold-Kemp-Jewellery\Kemp-Dance-Set",
  "01_Products\Kemp-Jewellery\Gold-Kemp-Jewellery\Kemp-Short-Necklace",
  "01_Products\Kemp-Jewellery\Gold-Kemp-Jewellery\Kemp-Long-Haram",
  "01_Products\Kemp-Jewellery\Gold-Kemp-Jewellery\Kemp-Mattal",
  "01_Products\Kemp-Jewellery\Gold-Kemp-Jewellery\Kemp-Mang-Tikka",
  "01_Products\Kemp-Jewellery\Gold-Kemp-Jewellery\Kemp-Earrings",
  "01_Products\Kemp-Jewellery\Gold-Kemp-Jewellery\Kemp-Headset",
  "01_Products\Kemp-Jewellery\Gold-Kemp-Jewellery\Kemp-Vaddanam-Waistbelt",
  "01_Products\Kemp-Jewellery\Gold-Kemp-Jewellery\Kemp-Accessories",
  "01_Products\Kemp-Jewellery\Black-Kemp-Jewellery\Dance-Set",
  "01_Products\Kemp-Jewellery\Black-Kemp-Jewellery\Short-Necklace",
  "01_Products\Kemp-Jewellery\Black-Kemp-Jewellery\Long-Haram",
  "01_Products\Kemp-Jewellery\Black-Kemp-Jewellery\Mattal",
  "01_Products\Kemp-Jewellery\Black-Kemp-Jewellery\Maang-Tikka",
  "01_Products\Kemp-Jewellery\Black-Kemp-Jewellery\Earrings",
  "01_Products\Kemp-Jewellery\Black-Kemp-Jewellery\Headset",
  "01_Products\Kemp-Jewellery\Black-Kemp-Jewellery\Oddiyanam",
  "01_Products\Kemp-Jewellery\Black-Kemp-Jewellery\Accessories"
)

$root = [System.IO.Path]::GetFullPath($RootPath)

New-Folder $root
New-Folder (Join-Path $root "00_Admin")
New-Folder (Join-Path $root "00_Brand")
New-Folder (Join-Path $root "02_Global-Reports")
New-Folder (Join-Path $root "03_Archive")

foreach ($leaf in $categoryLeaves) {
  $leafPath = Join-Path $root $leaf
  New-Folder $leafPath

  foreach ($workflow in $workflowFolders) {
    New-Folder (Join-Path $leafPath $workflow)
  }
}

$adminPath = Join-Path $root "00_Admin"
$trackerPath = Join-Path $adminPath "product-upload-master.csv"
$trackerHeader = @(
  "Status,Category Folder,Image Prefix,SKU,Product Title,Primary Collection,Extra Collections,Price,Compare At Price,Stock Qty,Weight (g),Material,Size,Color / Stone Color,Set Includes,Suitable For,Product Type,Vendor,Tags,SEO Keywords,Watermark Rule,Upload Run,Shopify Status,Shopify Product ID,Shopify Handle,Uploaded Date,Notes"
)
Write-TemplateFile -Path $trackerPath -Lines $trackerHeader

$collectionsPath = Join-Path $adminPath "collections-master.csv"
$collectionsRows = @(
  "Collection Name,Shopify Handle,Collection Group,Default Category Folder,Notes",
  "Deity Short Necklace,deity-short-harams,Deity Necklace,01_Products\Deity-God-Jewellery\Necklace\Short-Necklace,",
  "Deity Long Necklace,deity-long-harams,Deity Necklace,01_Products\Deity-God-Jewellery\Necklace\Long-Necklace,",
  "Gold Crowns,deity-crowns,Deity Crown,01_Products\Deity-God-Jewellery\Crown-Mukut\Gold-Crowns,",
  "Stone Crowns,deity-stone-crown,Deity Crown,01_Products\Deity-God-Jewellery\Crown-Mukut\Stone-Crowns,",
  "Bharatanatyam Short Necklace,bharatanatyam-short-necklaces,Bharatanatyam Necklace,01_Products\Bharatanatyam-Jewellery\Necklace\Short-Necklace,",
  "Bharatanatyam Long Necklace,bharatanatyam-long-necklace,Bharatanatyam Necklace,01_Products\Bharatanatyam-Jewellery\Necklace\Long-Necklace,"
)
Write-TemplateFile -Path $collectionsPath -Lines $collectionsRows

$readmePath = Join-Path $adminPath "README.txt"
$readmeLines = @(
  "Golden Collections Product Upload Workspace",
  "",
  "Use this as a strict upload workspace. Do not create loose category folders at the root.",
  "",
  "Allowed top-level folders:",
  "  00_Admin",
  "  00_Brand",
  "  01_Products",
  "  02_Global-Reports",
  "  03_Archive",
  "",
  "Use category folders under 01_Products for the kind of product, and use the tracker for the final business truth.",
  "",
  "Image naming rule:",
  "  ImagePrefix_1.jpg = main product image",
  "  ImagePrefix_2.jpg = close-up or second angle",
  "  ImagePrefix_3.jpg = detail or alternate image",
  "",
  "Daily workflow:",
  "  1. Put raw images in the correct 00_New-Raw-Images folder.",
  "  2. Add one product row in the master tracker.",
  "  3. Set Status to Ready only when price, stock, Weight (g), material, size, set includes, suitable for, and collections are filled.",
  "  4. Ask Codex to process that category folder.",
  "",
  "Fixed watermark rule:",
  "  Storefront images use darker brand-gold center GoldenCollections.com plus SKU stamp at bottom-right.",
  "  Clean Merchant feed images stay unwatermarked.",
  "",
  "Customs/tax defaults:",
  "  Country/Region of origin = India / IN unless owner says otherwise.",
  "  Charge tax = off unless owner says otherwise.",
  "  HS 711719 for alloy/base-metal plated imitation jewellery; do not blindly use 711790."
)
Write-TemplateFile -Path $readmePath -Lines $readmeLines

Write-Host ""
Write-Host "Done. Product upload workspace is ready at: $root"
