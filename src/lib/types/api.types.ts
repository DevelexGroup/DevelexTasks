export enum UserRole {
	Admin = 'ADMIN',
	GroupAdmin = 'GROUP_ADMIN',
	Student = 'STUDENT'
}

export const roleLabels: Record<UserRole, string> = {
	[UserRole.Admin]: 'Administrátor',
	[UserRole.GroupAdmin]: 'Správce skupiny',
	[UserRole.Student]: 'Student'
};

export type Capability =
	| 'SESSION_RUN_OWN'
	| 'SESSION_READ_GROUP'
	| 'SESSION_READ_ALL'
	| 'SESSION_MANAGE_ALL'
	| 'USER_EDIT_OWN'
	| 'USER_READ_GROUP'
	| 'USER_READ_ALL'
	| 'USER_CREATE_STUDENT_IN_GROUP'
	| 'USER_CREATE_ANY'
	| 'USER_MANAGE_ALL'
	| 'GROUP_READ_OWN'
	| 'GROUP_READ_ALL'
	| 'GROUP_MANAGE_OWN'
	| 'GROUP_MANAGE_ALL'
	| 'CONFIG_MANAGE';

export interface GroupDTO {
	id: string;
	name: string;
	description: string | null;
	memberCount: number | null;
}

export interface GroupMemberDTO {
	userUuid: string;
	username: string;
	firstName: string | null;
	lastName: string | null;
	role: UserRole;
	status: UserStatus;
	addedAt: Date;
}

export interface GroupCreateRequest {
	name: string;
	description?: string;
}

export interface AddMemberRequest {
	username: string;
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
	email?: string;
	firstName?: string;
	lastName?: string;
}

export interface UserDTO {
	id: string;
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	role: UserRole;
	status: UserStatus;
	createdAt: Date;
	lastLogin: Date | null;
	lastAction: Date | null;
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
	firstName: string | null;
	lastName: string | null;
	role: UserRole;
	capabilities: Capability[];
	groups: GroupDTO[];
}

export interface CurrentUserResponse {
	user: UserDTO;
	capabilities: Capability[];
	groups: GroupDTO[];
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
	files: TestFileDTO[];
}

export interface TestSessionDetailDTO extends TestSessionDTO {
	files: TestFileDTO[];
	parts: TestSessionPartDTO[];
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

export interface UserCreateRequest {
	username: string;
	password: string;
	email?: string;
	firstName?: string;
	lastName?: string;
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

export interface UserSessionsDTO {
	uuid: string;
	lastLogin: Date | null;
	activeSessionCount: number;
	hasActiveSession: boolean;
}

