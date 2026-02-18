export enum UserRole {
	Garant = 'GARANT',
	Lector = 'LECTOR',
	Student = 'STUDENT'
}

export enum TestSessionStatus {
	InProgress = 'IN_PROGRESS',
	Completed = 'COMPLETED',
	Abandoned = 'ABANDONED',
	Error = 'ERROR'
}

export enum StorageMode {
	Plain = 'PLAIN',
	CompressedOnly = 'COMPRESSED_ONLY',
	EncryptedOnly = 'ENCRYPTED_ONLY',
	CompressedEncrypted = 'COMPRESSED_ENCRYPTED'
}

export enum SortDirection {
	Asc = 'ASC',
	Desc = 'DESC'
}

export enum SortBy {
	SessionStartTime = 'sessionStartTime',
	SessionEndTime = 'sessionEndTime',
	CreatedAt = 'createdAt',
	UpdatedAt = 'updatedAt'
}

export interface TestSessionDTO {
	id: string;
	userId: string;
	username: string;
	userFullName: string;
	testType: string;
	status: TestSessionStatus;
	sessionStartTime: Date;
	sessionEndTime: Date;
	partCount: number;
	fileCount: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface RegisterRequest {
	username: string;
	password: string;
	email: string;
	firstName: string;
	lastName: string;
}

export interface UserDTO {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	createdAt: Date;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	expiresIn: Date;
	userId: string;
	username: string;
	firstName: string;
	lastName: string;
	role: UserRole;
}

export interface PageableObject {
	pageNumber: number;
	pageSize: number;
	offset: number;
	paged: boolean;
	unpaged: boolean;
	sort: SortObject;
}

export interface SortObject {
	property: string;
	direction: string;
	ascending: boolean;
	ignoreCase: boolean;
	nullHandling: string;
}

export interface FileMetadata {
	path: string;
	size: number;
	storageMode: StorageMode;
	created: string;
	modified: string;
}

export interface TestFileDTO {
	id: string;
	fileName: string;
	fileType: string;
	description: string;
	fileSize: number;
	originalSize: number;
	storageMode: StorageMode;
	compressed: boolean;
	encrypted: boolean;
	createdAt: Date;
}

export interface TestSessionPartDTO {
	id: string;
	partNumber: number;
	notes: string;
	startTime: Date;
	endTime: Date;
	createdAt: Date;
}

// org.springframework.data.domain Page<TContent>
export interface Page<TContent> {
	content: TContent[];
	totalElements: number;
	totalPages: number;
	numberOfElements: number;
	size: number;
	number: number;
	first: boolean;
	last: boolean;
	empty: boolean;
	pageable: PageableObject;
	sort: SortObject;
}

// User Management Types
export enum UserStatus {
	Active = 'ACTIVE',
	Unactive = 'UNACTIVE',
	Locked = 'LOCKED'
}

export interface UserBasicDTO {
	uuid: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	userRole: UserRole;
	status: UserStatus;
}

export interface UserDetailDTO {
	uuid: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	userRole: UserRole;
	status: UserStatus;
	createdAt: Date;
	updatedAt: Date;
	lastLoginAt?: Date;
	loginAttempts: number;
	locked: boolean;
}

export interface UserCreateRequest {
	username: string;
	password: string;
	email?: string;
	firstName: string;
	lastName: string;
	userRole?: UserRole;
}

export interface UserEditRequest {
	firstName?: string;
	lastName?: string;
	email?: string;
	userRole?: UserRole;
	status?: UserStatus;
	newPassword?: string;
}

export interface UserActionResponse {
	message: string;
	uuid: string;
	newRole?: string;
	newStatus?: string;
}
