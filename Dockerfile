# Hafif bir Python imajı kullanıyoruz
FROM python:3.12-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Sistem bağımlılıklarını yükle (Gerekirse)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Bağımlılıkları kopyala ve yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodlarını kopyala
COPY . .

# Geçici ses klasörünü oluştur ve izinleri ayarla
RUN mkdir -p temp_audio && chmod 777 temp_audio

# Uygulamanın çalışacağı portu aç
EXPOSE 8000

# Uygulamayı başlat
CMD ["python", "main.py"]
