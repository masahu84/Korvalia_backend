-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('RENT', 'SALE');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('FLAT', 'HOUSE', 'PENTHOUSE', 'DUPLEX', 'LAND', 'COMMERCIAL', 'GARAGE', 'ROOM', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'RESERVED', 'SOLD', 'RENTED');

-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "operation" "OperationType" NOT NULL,
    "propertyType" "PropertyCategory" NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "cityId" INTEGER NOT NULL,
    "neighborhood" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "areaM2" INTEGER,
    "builtYear" INTEGER,
    "floor" INTEGER,
    "hasElevator" BOOLEAN,
    "hasParking" BOOLEAN,
    "hasPool" BOOLEAN,
    "hasTerrace" BOOLEAN,
    "hasGarden" BOOLEAN,
    "furnished" BOOLEAN,
    "petsAllowed" BOOLEAN,
    "energyRating" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "propertyId" INTEGER NOT NULL,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "province" TEXT,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" SERIAL NOT NULL,
    "logoUrl" TEXT,
    "heroTitle" TEXT NOT NULL DEFAULT 'Bienvenido a nuestra inmobiliaria',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Encuentra la propiedad de tus sueños',
    "heroImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "companyName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "whatsappNumber" TEXT,
    "schedule" TEXT,
    "aboutUs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isSuper" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_cityId_idx" ON "Property"("cityId");

-- CreateIndex
CREATE INDEX "Property_operation_idx" ON "Property"("operation");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_isFeatured_idx" ON "Property"("isFeatured");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_idx" ON "PropertyImage"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyImage_order_idx" ON "PropertyImage"("order");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "City_slug_idx" ON "City"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_email_idx" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
